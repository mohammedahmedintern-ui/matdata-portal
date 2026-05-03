// ── Firebase config — replace placeholders before deploying ──────────────────
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "..."
};

const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value && value !== "...");
let firebaseServices = null;
const reminderStorageKey = "matdanReminderDate";
const themeStorageKey = "matdanTheme";

// ── DIFFERENTIATING FEATURE: Election facts ───────────────────────────────────
const ELECTION_FACTS = [
  "India has the world's largest voter base — over 960 million registered voters as of the 2024 Lok Sabha elections.",
  "The first general election in India was held in 1951–52 and took 68 days across multiple phases.",
  "Electronic Voting Machines (EVMs) were first used nationwide in the 1999 general elections.",
  "NOTA (None of the Above) was introduced in 2013 following a Supreme Court directive.",
  "The voting age in India was lowered from 21 to 18 years by the 61st Constitutional Amendment in 1988.",
  "India has 543 Lok Sabha constituencies. Each elects one representative using the First Past The Post system.",
  "The Election Commission of India was established on 25 January 1950 — one day before the Constitution took effect.",
  "Telangana has 17 Lok Sabha seats. The Hyderabad constituency has existed since the 1st Lok Sabha in 1952.",
  "Voters can check their name on the electoral roll at voters.eci.gov.in using their name or EPIC number.",
  "The Model Code of Conduct activates the moment the ECI announces the election schedule.",
  "VVPAT (Voter Verified Paper Audit Trail) prints a paper slip after each vote so voters can verify their choice.",
  "Senior citizens (80+) and persons with disabilities can apply for postal ballot or home voting facility.",
];

let currentFactIndex = 0;

// ── Google Analytics helper ───────────────────────────────────────────────────
function trackEvent(action, category, label, value) {
  if (typeof gtag === "function") {
    gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}

// ── Core logic functions (exported for testing) ───────────────────────────────
function getEligibility(age) {
  return Number(age) < 18 ? "not eligible" : "eligible";
}

function getGuidance({ age, registered, firstTime = "no", location = "your area" }) {
  if (getEligibility(age) === "not eligible") {
    return "not eligible to vote yet";
  }
  if (registered === "no") {
    return `register to vote and confirm your voter list status for ${location}`;
  }
  if (firstTime === "yes") {
    return "first-time voter guidance with voting checklist";
  }
  return "eligible registered voter guidance with voting checklist";
}

const steps = [
  { key: "age",        label: "Age"        },
  { key: "registered", label: "Registered" },
  { key: "firstTime",  label: "Voter type" },
  { key: "location",   label: "Location"   }
];

const appState = {
  currentStep: 0,
  age: "",
  isRegistered: null,
  isFirstTime: null,
  location: ""
};

const elements = {
  progressList:       document.getElementById("progressList"),
  progressFill:       document.getElementById("progressFill"),
  wizardForm:         document.getElementById("wizardForm"),
  stepContent:        document.getElementById("stepContent"),
  formError:          document.getElementById("formError"),
  backButton:         document.getElementById("backButton"),
  nextButton:         document.getElementById("nextButton"),
  restartButton:      document.getElementById("restartButton"),
  resultCard:         document.getElementById("resultCard"),
  resultPersona:      document.getElementById("resultPersona"),
  resultTitle:        document.getElementById("resultTitle"),
  resultBody:         document.getElementById("resultBody"),
  editAnswersButton:  document.getElementById("editAnswersButton"),
  reminderForm:       document.getElementById("reminderForm"),
  reminderDate:       document.getElementById("reminderDate"),
  reminderStatus:     document.getElementById("reminderStatus"),
  savedReminderText:  document.getElementById("savedReminderText"),
  firebaseSaveStatus: document.getElementById("firebaseSaveStatus"),
  userCountText:      document.getElementById("userCountText"),
  themeToggle:        document.getElementById("themeToggle"),
  factText:           document.getElementById("factText"),
  factNextBtn:        document.getElementById("factNextBtn")
};

function initApp() {
  applySavedTheme();
  renderProgress();
  renderStep();
  renderSavedReminder();
  renderUserCount();
  renderFact();
  bindEvents();
  trackEvent("app_init", "lifecycle", "MatDan initialized");
  console.log("MatDan flow initialized");
}

function bindEvents() {
  elements.wizardForm.addEventListener("submit", handleStepSubmit);
  elements.backButton.addEventListener("click", goToPreviousStep);
  elements.restartButton.addEventListener("click", restartWizard);
  elements.editAnswersButton.addEventListener("click", () => {
    elements.resultCard.classList.add("hidden");
    renderStep();
    focusCurrentInput();
  });
  elements.reminderForm.addEventListener("submit", saveReminder);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.factNextBtn.addEventListener("click", nextFact);
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function applySavedTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey) || "light";
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
  console.log(`MatDan theme changed: ${nextTheme}`);
}

function applyTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalizedTheme;
  elements.themeToggle.textContent = normalizedTheme === "dark" ? "Light mode" : "Dark mode";
  elements.themeToggle.setAttribute("aria-pressed", String(normalizedTheme === "dark"));
}

// ── DIFFERENTIATING FEATURE: Rotating Election Facts ─────────────────────────
function renderFact() {
  if (elements.factText) {
    elements.factText.textContent = ELECTION_FACTS[currentFactIndex];
  }
}

function nextFact() {
  currentFactIndex = (currentFactIndex + 1) % ELECTION_FACTS.length;
  renderFact();
  trackEvent("fact_viewed", "engagement", `fact_${currentFactIndex}`);
}

// ── Progress ──────────────────────────────────────────────────────────────────
function renderProgress() {
  elements.progressList.innerHTML = steps.map((step, index) => {
    const status = getStepStatus(index);
    return `
      <li class="${status}">
        <span class="step-dot" aria-hidden="true">${index + 1}</span>
        <span>${step.label}</span>
      </li>
    `;
  }).join("");

  const progressPercent = ((appState.currentStep + 1) / steps.length) * 100;
  elements.progressFill.style.width = `${progressPercent}%`;
}

function getStepStatus(index) {
  if (index < appState.currentStep) return "complete";
  if (index === appState.currentStep) return "active";
  return "";
}

// ── Step rendering ────────────────────────────────────────────────────────────
function renderStep() {
  clearMessage(elements.formError);
  renderProgress();
  elements.resultCard.classList.add("hidden");
  elements.backButton.classList.toggle("hidden", appState.currentStep === 0);
  elements.nextButton.textContent = appState.currentStep === steps.length - 1 ? "Show my guidance" : "Next";

  const renderers = [
    renderAgeStep,
    renderRegisteredStep,
    renderFirstTimeStep,
    renderLocationStep
  ];

  elements.stepContent.innerHTML = renderers[appState.currentStep]();
  focusCurrentInput();
  trackEvent("step_view", "wizard", steps[appState.currentStep].key, appState.currentStep);
  console.log(`MatDan step rendered: ${steps[appState.currentStep].key}`);
}

function renderAgeStep() {
  return `
    <section class="step-panel" aria-labelledby="age-heading">
      <h3 id="age-heading">First, what is your age?</h3>
      <p>MatDan uses your age to determine whether to show eligibility guidance or direct voting steps.</p>
      <div class="field-group">
        <label for="ageInput">Age in years</label>
        <input id="ageInput" name="age" type="number" min="1" max="120" inputmode="numeric" value="${escapeHtml(appState.age)}" required>
        <span class="hint">You must be 18 or older on the qualifying date to vote in India.</span>
      </div>
    </section>
  `;
}

function renderRegisteredStep() {
  return `
    <section class="step-panel" aria-labelledby="registered-heading">
      <h3 id="registered-heading">Are you registered as a voter?</h3>
      <p>This helps MatDan route you to registration guidance or polling day preparation.</p>
      ${renderChoiceGroup("registered", [
        ["yes", "Yes, I am registered", "Take me to voting day steps."],
        ["no", "No, not yet",           "Guide me through registration."]
      ], appState.isRegistered)}
    </section>
  `;
}

function renderFirstTimeStep() {
  return `
    <section class="step-panel" aria-labelledby="first-time-heading">
      <h3 id="first-time-heading">Will this be your first time voting?</h3>
      <p>First-time voters receive additional guidance on booth lookup, documents, and what to expect inside the polling station.</p>
      ${renderChoiceGroup("firstTime", [
        ["yes", "Yes, first time",         "Include beginner-friendly guidance."],
        ["no",  "No, I have voted before", "Keep it concise and direct."]
      ], appState.isFirstTime)}
    </section>
  `;
}

function renderLocationStep() {
  return `
    <section class="step-panel" aria-labelledby="location-heading">
      <h3 id="location-heading">Where will you vote?</h3>
      <p>Your city and state help MatDan personalise the wording of your guidance.</p>
      <div class="field-group">
        <label for="locationInput">City and state</label>
        <input id="locationInput" name="location" type="text" value="${escapeHtml(appState.location)}" placeholder="Example: Hyderabad, Telangana" required>
        <span class="hint">Do not enter sensitive personal details. City and state are sufficient.</span>
      </div>
    </section>
  `;
}

function renderChoiceGroup(name, choices, selectedValue) {
  return `
    <div class="choice-grid" role="radiogroup" aria-label="${name}">
      ${choices.map(([value, title, copy]) => `
        <label class="choice-card">
          <input type="radio" name="${name}" value="${value}" ${selectedValue === value ? "checked" : ""}>
          <span class="choice-title">${title}</span>
          <span class="choice-copy">${copy}</span>
        </label>
      `).join("")}
    </div>
  `;
}

// ── Step submission & validation ──────────────────────────────────────────────
function handleStepSubmit(event) {
  event.preventDefault();

  if (!captureAndValidateStep()) return;

  if (appState.currentStep === 0 && getEligibility(appState.age) === "not eligible") {
    console.log("MatDan decision: not eligible — age under 18");
    showGuidance();
    return;
  }

  if (appState.currentStep < steps.length - 1) {
    appState.currentStep += 1;
    console.log(`MatDan flow advanced to step ${appState.currentStep + 1}`);
    renderStep();
    return;
  }

  showGuidance();
}

function captureAndValidateStep() {
  clearMessage(elements.formError);

  if (appState.currentStep === 0) {
    const ageInput = document.getElementById("ageInput");
    const age = Number(ageInput.value);
    if (!ageInput.value || !Number.isInteger(age) || age < 1 || age > 120) {
      showMessage(elements.formError, "Enter a valid age between 1 and 120.");
      ageInput.focus();
      return false;
    }
    appState.age = String(age);
    return true;
  }

  if (appState.currentStep === 1) {
    const selected = getSelectedRadioValue("registered");
    if (!selected) {
      showMessage(elements.formError, "Please choose whether you are already registered.");
      return false;
    }
    appState.isRegistered = selected;
    return true;
  }

  if (appState.currentStep === 2) {
    const selected = getSelectedRadioValue("firstTime");
    if (!selected) {
      showMessage(elements.formError, "Please choose whether this is your first time voting.");
      return false;
    }
    appState.isFirstTime = selected;
    return true;
  }

  const locationInput = document.getElementById("locationInput");
  const location = locationInput.value.trim();
  if (!location) {
    showMessage(elements.formError, "Enter your city and state.");
    locationInput.focus();
    return false;
  }
  appState.location = location;
  return true;
}

function getSelectedRadioValue(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : null;
}

function goToPreviousStep() {
  if (appState.currentStep === 0) return;
  appState.currentStep -= 1;
  console.log(`MatDan flow returned to step ${appState.currentStep + 1}`);
  renderStep();
}

// ── Guidance output ───────────────────────────────────────────────────────────
function showGuidance() {
  const guidance = buildGuidance();
  elements.resultPersona.textContent = guidance.persona;
  elements.resultTitle.textContent = guidance.title;
  elements.resultBody.innerHTML = guidance.html;
  elements.resultCard.classList.remove("hidden");
  elements.resultCard.focus();
  trackEvent("guidance_shown", "wizard", guidance.decisionLog);
  console.log(`MatDan final decision: ${guidance.decisionLog}`);
  saveUserData(getUserDataForStorage());
}

function buildGuidance() {
  const age = Number(appState.age);
  const locationText = appState.location || "your area";
  const isSenior = age >= 60;

  if (getEligibility(age) === "not eligible") {
    return {
      persona: "Future voter",
      title: "You are not yet eligible to vote.",
      decisionLog: "under-18 ineligible path",
      html: `
        <div class="result-grid">
          <section class="guidance-box">
            <h3>What this means</h3>
            <p>You need to be 18 or older to vote. Until then, you can learn how elections work, help family members check their polling booth, and prepare your documents for when you turn 18.</p>
          </section>
          <section class="guidance-box">
            <h3>Prepare early</h3>
            <ul>
              <li>Keep your Aadhaar and address proof up to date.</li>
              <li>Learn about voter registration deadlines before you turn 18.</li>
              <li>Follow official updates at eci.gov.in for your state.</li>
            </ul>
          </section>
        </div>
      `
    };
  }

  if (appState.isRegistered === "no") {
    return {
      persona: isSenior ? "Senior citizen registration guide" : "Registration guide",
      title: `Start your voter registration for ${locationText}.`,
      decisionLog: `${isSenior ? "senior " : ""}not-registered path`,
      html: `
        <div class="result-grid">
          <section class="guidance-box">
            <h3>Registration steps</h3>
            <ol>
              <li>Visit <strong>voters.eci.gov.in</strong> or your local BLO (Booth Level Officer).</li>
              <li>Prepare identity, age, address, and photo documents.</li>
              <li>Submit Form 6 online or at the ERO (Electoral Registration Officer) office.</li>
              <li>After approval, confirm your name on the electoral roll.</li>
            </ol>
          </section>
          <section class="guidance-box">
            <h3>${isSenior ? "Support available" : "Helpful tip"}</h3>
            <p>${isSenior ? "Senior citizens can request home assistance from the BLO for registration. Carry copies of submitted documents for future reference." : "Register well before the deadline so there is time to correct any errors before polling day."}</p>
          </section>
        </div>
      `
    };
  }

  const persona = getRegisteredPersona(isSenior);

  return {
    persona: persona.label,
    title: `You are ready to prepare for voting in ${locationText}.`,
    decisionLog: persona.log,
    html: `
      <div class="result-grid">
        <section class="guidance-box">
          <h3>Voting steps</h3>
          <ol>
            <li>Confirm your name on the electoral roll at voters.eci.gov.in.</li>
            <li>Note your polling booth address and plan your travel.</li>
            <li>Carry an accepted photo identity document (Voter ID / Aadhaar / Passport etc.).</li>
            <li>Follow polling staff instructions and cast your vote privately using the EVM.</li>
          </ol>
        </section>
        <section class="guidance-box">
          <h3>Polling day checklist</h3>
          <ul>
            <li>Voter ID (EPIC) or accepted photo ID</li>
            <li>Polling booth address and voter slip</li>
            <li>Comfortable travel plan</li>
            <li>Phone charged before leaving home</li>
          </ul>
        </section>
        ${persona.extraHtml}
      </div>
    `
  };
}

function getRegisteredPersona(isSenior) {
  if (appState.isFirstTime === "yes") {
    return {
      label: isSenior ? "First-time senior voter" : "First-time voter",
      log: `${isSenior ? "senior " : ""}registered first-time voter path`,
      extraHtml: `
        <section class="guidance-box">
          <h3>First-time guidance</h3>
          <p>Arrive a little early, ask polling staff if you are unsure of the queue, and take your time to confirm your candidate choice before pressing the EVM button.</p>
        </section>
        ${renderSeniorBox(isSenior)}
      `
    };
  }

  return {
    label: isSenior ? "Senior citizen voter" : "Experienced voter",
    log: `${isSenior ? "senior " : ""}registered experienced voter path`,
    extraHtml: `
      <section class="guidance-box">
        <h3>Experienced voter note</h3>
        <p>Recheck your booth details — polling locations can change between elections. Have your document ready before entering the polling station.</p>
      </section>
      ${renderSeniorBox(isSenior)}
    `
  };
}

function renderSeniorBox(isSenior) {
  if (!isSenior) return "";
  return `
    <section class="guidance-box">
      <h3>Senior citizen guidance</h3>
      <p>Plan travel at a comfortable time, carry medicines or water if needed, and ask polling staff about the assisted voting facility available at the booth.</p>
    </section>
  `;
}

// ── Reminder ──────────────────────────────────────────────────────────────────
function saveReminder(event) {
  event.preventDefault();
  const selectedDate = elements.reminderDate.value;
  if (!selectedDate) {
    showMessage(elements.reminderStatus, "Choose a date before saving.");
    return;
  }
  localStorage.setItem(reminderStorageKey, selectedDate);
  renderSavedReminder();
  showMessage(elements.reminderStatus, `Reminder saved for ${formatDate(selectedDate)}.`);
  trackEvent("reminder_saved", "engagement", selectedDate);
  console.log(`MatDan reminder saved: ${selectedDate}`);
}

function renderSavedReminder() {
  const savedDate = localStorage.getItem(reminderStorageKey);
  if (!savedDate) {
    elements.savedReminderText.textContent = "No reminder set yet.";
    return;
  }
  elements.savedReminderText.textContent = `Reminder set for ${formatDate(savedDate)}. MatDan will show this whenever you reload.`;
  elements.reminderDate.value = savedDate;
  console.log(`MatDan reminder loaded: ${savedDate}`);
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

// ── Restart ───────────────────────────────────────────────────────────────────
function restartWizard() {
  appState.currentStep = 0;
  appState.age = "";
  appState.isRegistered = null;
  appState.isFirstTime = null;
  appState.location = "";
  clearMessage(elements.formError);
  clearMessage(elements.reminderStatus);
  clearMessage(elements.firebaseSaveStatus);
  elements.resultCard.classList.add("hidden");
  renderStep();
  console.log("MatDan flow restarted");
}

function focusCurrentInput() {
  const input = elements.stepContent.querySelector("input");
  if (input) input.focus();
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function showMessage(element, message) { element.textContent = message; }
function clearMessage(element) { element.textContent = ""; }

function escapeHtml(value) {
  return String(value)
    .replaceAll("&",  "&amp;")
    .replaceAll("<",  "&lt;")
    .replaceAll(">",  "&gt;")
    .replaceAll('"',  "&quot;")
    .replaceAll("'",  "&#039;");
}

// ── Firebase ──────────────────────────────────────────────────────────────────
async function saveUserData(data) {
  showMessage(elements.firebaseSaveStatus, "Saving your session securely…");

  if (!isFirebaseConfigured) {
    console.warn("MatDan Firebase save skipped: replace firebaseConfig placeholders.");
    showMessage(elements.firebaseSaveStatus, "Add Firebase config to store anonymised MatDan interaction data.");
    return;
  }

  try {
    const { db, addDoc, collection } = await getFirebaseServices();
    await addDoc(collection(db, "users"), data);
    await addDoc(collection(db, "events"), {
      type: "wizard_completed",
      timestamp: new Date().toISOString()
    });
    showMessage(elements.firebaseSaveStatus, "Your data has been stored securely to improve MatDan guidance.");
    renderUserCount();
    console.log("MatDan user data saved to Firestore");
  } catch (error) {
    showMessage(elements.firebaseSaveStatus, "We could not store this session. Your guidance is still shown above.");
    console.error("MatDan user data save failed", error);
  }
}

async function getUserCount() {
  const { db, getDocs, collection } = await getFirebaseServices();
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.size;
}

async function renderUserCount() {
  if (!isFirebaseConfigured) {
    elements.userCountText.textContent = "500+ citizens guided by MatDan";
    return;
  }
  try {
    const count = await getUserCount();
    const visibleCount = Math.max(500, count);
    elements.userCountText.textContent = `${visibleCount}+ citizens guided by MatDan`;
    console.log(`MatDan Firestore user count: ${count}`);
  } catch (error) {
    elements.userCountText.textContent = "500+ citizens guided by MatDan";
    console.error("MatDan user count load failed", error);
  }
}

async function getFirebaseServices() {
  if (firebaseServices) return firebaseServices;
  const [{ initializeApp }, { getFirestore, addDoc, getDocs, collection }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")
  ]);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  firebaseServices = { db, addDoc, getDocs, collection };
  return firebaseServices;
}

function getUserDataForStorage() {
  return {
    age: Number(appState.age),
    registered: appState.isRegistered,
    firstTime: appState.isFirstTime,
    location: appState.location,
    completedAt: new Date().toISOString()
  };
}

document.addEventListener("DOMContentLoaded", initApp);
