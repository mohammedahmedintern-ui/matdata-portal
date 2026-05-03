// ============================================================
// MatDan Portal — Comprehensive Test Suite
// Plain JavaScript unit tests (no frameworks)
// Run: npm test
// ============================================================

const fs = require("fs");
const vm = require("vm");

// ── Helpers ──────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

function assertEqual(actual, expected, testName) {
  const ok = actual === expected;
  if (ok) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Expected: ${JSON.stringify(expected)}`);
    console.error(`     Actual:   ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(haystack, needle, testName) {
  const ok = String(haystack).includes(needle);
  if (ok) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Expected string to include: ${JSON.stringify(needle)}`);
  }
}

function group(name) {
  console.log(`\n━━━ ${name} ━━━`);
}

// ── DOM & environment stubs ──────────────────────────────────

function createElementStub() {
  return {
    textContent: "",
    innerHTML: "",
    value: "",
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    addEventListener() {},
    focus() {},
    querySelector() { return null; },
    setAttribute() {},
    getAttribute() { return null; },
    style: {},
  };
}

function buildContext() {
  const context = {
    console,
    Intl,
    Date,
    Number,
    String,
    Object,
    Array,
    Math,
    Promise,
    setTimeout,
    clearTimeout,
    localStorage: {
      _store: {},
      getItem(key)        { return this._store[key] || null; },
      setItem(key, value) { this._store[key] = String(value); },
      removeItem(key)     { delete this._store[key]; },
    },
    document: {
      documentElement: { dataset: {} },
      getElementById()  { return createElementStub(); },
      addEventListener() {},
      querySelector()   { return null; },
    },
  };
  vm.createContext(context);
  return context;
}

function loadApp() {
  const source = fs.readFileSync("script.js", "utf8");
  const accessors = `
    function _getSteps()              { return steps; }
    function _getAppState()           { return appState; }
    function _getFirebaseConfigured() { return isFirebaseConfigured; }
  `;
  const context = buildContext();
  vm.runInContext(source + accessors, context);
  return context;
}

// ── Load the app once ────────────────────────────────────────

const app = loadApp();

// ============================================================
// TEST GROUP 1: getEligibility
// ============================================================

group("1. getEligibility — Age eligibility checks");

assertEqual(app.getEligibility(17),   "not eligible", "Age 17 → not eligible");
assertEqual(app.getEligibility(18),   "eligible",     "Age 18 → eligible");
assertEqual(app.getEligibility(25),   "eligible",     "Age 25 → eligible");
assertEqual(app.getEligibility(65),   "eligible",     "Age 65 (senior) → eligible");
assertEqual(app.getEligibility(1),    "not eligible", "Age 1 → not eligible");
assertEqual(app.getEligibility(0),    "not eligible", "Age 0 → not eligible");
assertEqual(app.getEligibility("20"), "eligible",     "String '20' → eligible (Number coercion)");
assertEqual(app.getEligibility("10"), "not eligible", "String '10' → not eligible (Number coercion)");

// ============================================================
// TEST GROUP 2: getGuidance — Decision logic branches
// ============================================================

group("2. getGuidance — Decision-based guidance output");

assertIncludes(app.getGuidance({ age: 15, registered: "yes" }), "not eligible",              "Age 15 → guidance includes 'not eligible'");
assertIncludes(app.getGuidance({ age: 25, registered: "no" }),  "register",                  "Age 25, not registered → guidance includes 'register'");
assertIncludes(app.getGuidance({ age: 30, registered: "no", location: "Mumbai" }), "Mumbai", "Location 'Mumbai' appears in registration guidance");
assertIncludes(app.getGuidance({ age: 19, registered: "yes", firstTime: "yes" }), "first-time voter guidance", "First-time voter → includes 'first-time voter guidance'");
assertIncludes(app.getGuidance({ age: 40, registered: "yes", firstTime: "no" }),  "eligible registered voter guidance", "Experienced voter → includes correct guidance string");
assertIncludes(app.getGuidance({ age: 22, registered: "no" }), "your area",                  "No location → defaults to 'your area'");

// ============================================================
// TEST GROUP 3: Edge cases
// ============================================================

group("3. Edge cases — Empty and invalid inputs");

assertEqual(app.getEligibility(-5),        "not eligible", "Negative age → not eligible");
assertEqual(app.getEligibility(150),       "eligible",     "Age 150 → eligible (no upper cap in eligibility)");
assertEqual(app.getEligibility(NaN),       "eligible",     "NaN input → eligible (NaN < 18 is false)");
assertEqual(app.getEligibility(undefined), "eligible",     "Undefined age → eligible (NaN comparison)");
assertEqual(app.getEligibility(""),        "not eligible", "Empty string age → not eligible (coerces to 0)");
assertEqual(app.getEligibility(null),      "not eligible", "null age → not eligible (coerces to 0)");

// ============================================================
// TEST GROUP 4: escapeHtml — XSS prevention
// ============================================================

group("4. escapeHtml — XSS prevention");

assertEqual(
  app.escapeHtml("<script>alert('xss')</script>"),
  "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;",
  "Angle brackets and quotes are escaped"
);
assertEqual(app.escapeHtml("Tom & Jerry"),    "Tom &amp; Jerry",    "Ampersand is escaped");
assertEqual(app.escapeHtml('value="test"'),   "value=&quot;test&quot;", "Double quotes are escaped");
assertEqual(app.escapeHtml(""),               "",                   "Empty string returns empty string");
assertEqual(app.escapeHtml("Hello World"),    "Hello World",        "Plain text remains unchanged");

// ============================================================
// TEST GROUP 5: formatDate
// ============================================================

group("5. formatDate — Date formatting");

const formatted25 = app.formatDate("2026-01-26");
assert(typeof formatted25 === "string" && formatted25.length > 0, "formatDate('2026-01-26') returns non-empty string");
assertIncludes(app.formatDate("2026-01-26"), "2026", "formatDate includes the year 2026");

// ============================================================
// TEST GROUP 6: Steps configuration
// ============================================================

group("6. Steps configuration integrity");

const steps = app._getSteps();
assertEqual(steps.length,    4,          "Steps array has exactly 4 items");
assertEqual(steps[0].key,    "age",      "First step key is 'age'");
assertEqual(steps[3].key,    "location", "Last step key is 'location'");
assert(steps.every((s) => typeof s.label === "string" && s.label.length > 0), "All steps have non-empty string labels");

// ============================================================
// TEST GROUP 7: appState — Initial state
// ============================================================

group("7. appState — Initial state validation");

const appState = app._getAppState();
assertEqual(appState.currentStep, 0,    "appState.currentStep starts at 0");
assertEqual(appState.age,         "",   "appState.age starts as empty string");
assertEqual(appState.isRegistered, null, "appState.isRegistered starts null");
assertEqual(appState.isFirstTime,  null, "appState.isFirstTime starts null");
assertEqual(appState.location,    "",   "appState.location starts as empty string");

// ============================================================
// TEST GROUP 8: getStepStatus
// ============================================================

group("8. getStepStatus — Step progress states");

assertEqual(app.getStepStatus(0), "active", "Index 0 at step 0 → 'active'");
assertEqual(app.getStepStatus(2), "",        "Index 2 at step 0 → '' (future)");

appState.currentStep = 2;
assertEqual(app.getStepStatus(0), "complete", "Index 0 at step 2 → 'complete'");
assertEqual(app.getStepStatus(2), "active",   "Index 2 at step 2 → 'active'");
appState.currentStep = 0;

// ============================================================
// TEST GROUP 9: getUserDataForStorage
// ============================================================

group("9. getUserDataForStorage — Data shape");

appState.age = "25";
appState.isRegistered = "yes";
appState.isFirstTime = "no";
appState.location = "Delhi";

const userData = app.getUserDataForStorage();

assertEqual(typeof userData.age, "number", "userData.age is a number");
assertEqual(userData.age,         25,       "userData.age equals 25");
assertEqual(userData.registered,  "yes",    "userData.registered equals 'yes'");
assertEqual(userData.firstTime,   "no",     "userData.firstTime equals 'no'");
assertEqual(userData.location,    "Delhi",  "userData.location equals 'Delhi'");
assert(
  typeof userData.completedAt === "string" && userData.completedAt.includes("T"),
  "userData.completedAt is an ISO timestamp string"
);

appState.age = "";
appState.isRegistered = null;
appState.isFirstTime = null;
appState.location = "";
appState.currentStep = 0;

// ============================================================
// TEST GROUP 10: buildGuidance
// ============================================================

group("10. buildGuidance — Full guidance rendering");

appState.age = "15";
const guidance46 = app.buildGuidance();
assertEqual(guidance46.persona, "Future voter", "Under-18 persona is 'Future voter'");
assertIncludes(guidance46.title, "not yet eligible", "Under-18 title includes 'not yet eligible'");
assert(guidance46.html.length > 50, "Under-18 guidance html is substantial content");

appState.age = "30"; appState.isRegistered = "no";
const guidance49 = app.buildGuidance();
assertEqual(guidance49.persona, "Registration guide", "Not-registered adult persona is 'Registration guide'");

appState.age = "65"; appState.isRegistered = "no";
const guidance50 = app.buildGuidance();
assertEqual(guidance50.persona, "Senior citizen registration guide", "Senior not-registered persona correct");

appState.age = "19"; appState.isRegistered = "yes"; appState.isFirstTime = "yes"; appState.location = "Pune, Maharashtra";
const guidance51 = app.buildGuidance();
assertEqual(guidance51.persona, "First-time voter", "First-time voter persona is 'First-time voter'");
assertIncludes(guidance51.title, "Pune, Maharashtra", "Location appears in guidance title");

appState.age = "40"; appState.isRegistered = "yes"; appState.isFirstTime = "no"; appState.location = "Chennai";
const guidance53 = app.buildGuidance();
assertEqual(guidance53.persona, "Experienced voter", "Experienced voter persona correct");

appState.age = "62"; appState.isRegistered = "yes"; appState.isFirstTime = "yes"; appState.location = "Kolkata";
const guidance54 = app.buildGuidance();
assertEqual(guidance54.persona, "First-time senior voter", "Senior first-time voter persona correct");

appState.age = "70"; appState.isRegistered = "yes"; appState.isFirstTime = "no"; appState.location = "Jaipur";
const guidance55 = app.buildGuidance();
assertEqual(guidance55.persona, "Senior citizen voter", "Senior experienced voter persona correct");

appState.age = "10";
const guidance56 = app.buildGuidance();
assertEqual(guidance56.decisionLog, "under-18 ineligible path", "Under-18 decisionLog correct");

appState.age = ""; appState.isRegistered = null; appState.isFirstTime = null; appState.location = ""; appState.currentStep = 0;

// ============================================================
// TEST GROUP 11: renderSeniorBox
// ============================================================

group("11. renderSeniorBox — Conditional senior content");

assertEqual(app.renderSeniorBox(false), "", "renderSeniorBox(false) → empty string");
const seniorHtml = app.renderSeniorBox(true);
assert(seniorHtml.length > 0, "renderSeniorBox(true) → non-empty HTML");
assertIncludes(seniorHtml, "Senior citizen guidance", "Senior box includes 'Senior citizen guidance' heading");

// ============================================================
// TEST GROUP 12: Firebase configuration
// ============================================================

group("12. Firebase configuration validation");

const isFirebaseConfigured = app._getFirebaseConfigured();
assert(typeof isFirebaseConfigured === "boolean", "isFirebaseConfigured is a boolean");
assertEqual(isFirebaseConfigured, false, "Default '...' placeholders → isFirebaseConfigured is false");

// ============================================================
// TEST GROUP 13: showMessage / clearMessage
// ============================================================

group("13. showMessage / clearMessage — UI messaging");

const mockEl = { textContent: "" };
app.showMessage(mockEl, "Test message");
assertEqual(mockEl.textContent, "Test message", "showMessage sets element textContent");
app.clearMessage(mockEl);
assertEqual(mockEl.textContent, "", "clearMessage resets element textContent to empty");

// ============================================================
// SUMMARY
// ============================================================

console.log("\n══════════════════════════════════════════════════");
console.log(`  Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
console.log("══════════════════════════════════════════════════");

if (failed > 0) {
  console.error(`\n⚠️  ${failed} test(s) failed. Review output above.`);
  process.exit(1);
} else {
  console.log("\n🎉 All tests passed!");
  process.exit(0);
}
