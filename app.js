// ── CONFIG ──────────────────────────────────────────────────────────────────
// Get your FREE Gemini API key at: https://aistudio.google.com/app/apikey
// Paste it between the quotes below
const GEMINI_API_KEY = "AIzaSyCL4IYNxxX8xsEpJEPoLZW4crkhiKtet2A";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── STATE ────────────────────────────────────────────────────────────────────
let conversationHistory = []; // Maintains multi-turn context
let triviaIndex = 0;

// ── DOM REFS ─────────────────────────────────────────────────────────────────
const chatMessages = document.getElementById('chat-messages');
const userInput    = document.getElementById('user-input');
const sendBtn      = document.getElementById('send-btn');
const triviaText   = document.getElementById('trivia-text');

// ── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    document.getElementById('api-notice').style.display = 'block';
  }

  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  });

  // Send on Enter (Shift+Enter for newline)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Shuffle trivia on load
  triviaIndex = Math.floor(Math.random() * TRIVIA_FACTS.length);
  updateTrivia();
});

// ── TRIVIA ───────────────────────────────────────────────────────────────────
function nextTrivia() {
  triviaIndex = (triviaIndex + 1) % TRIVIA_FACTS.length;
  updateTrivia();
}

function updateTrivia() {
  triviaText.style.opacity = '0';
  setTimeout(() => {
    triviaText.textContent = TRIVIA_FACTS[triviaIndex];
    triviaText.style.transition = 'opacity 0.4s';
    triviaText.style.opacity = '1';
  }, 200);
}

// ── QUICK TOPIC BUTTONS ───────────────────────────────────────────────────────
function askTopic(question) {
  userInput.value = question;
  sendMessage();
}

// ── CHAT RENDER ───────────────────────────────────────────────────────────────
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  // Simple markdown-like: bold (**text**), line breaks
  div.innerHTML = formatText(text);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')   // bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>')               // italic
    .replace(/\n\n/g, '<br><br>')                        // double newline
    .replace(/\n/g, '<br>')                              // single newline
    .replace(/^- (.+)/gm, '• $1');                      // list items
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.id = 'typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

// ── SEND MESSAGE ──────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Reset input
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;

  // Render user message
  appendMessage('user', text);

  // Add to history (multi-turn context)
  conversationHistory.push({ role: 'user', parts: [{ text }] });

  // Show typing
  showTyping();

  try {
    const response = await callGemini(text);
    removeTyping();
    appendMessage('bot', response);
    conversationHistory.push({ role: 'model', parts: [{ text: response }] });
  } catch (err) {
    removeTyping();
    appendMessage('bot', `⚠️ **Error:** ${err.message}. Please check your API key or internet connection.`);
    console.error('Gemini API error:', err);
  }

  sendBtn.disabled = false;
  userInput.focus();
}

// ── GEMINI API CALL ───────────────────────────────────────────────────────────
async function callGemini(userText) {
  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ]
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];

  if (!candidate) throw new Error('No response from Gemini.');

  // Handle safety blocks
  if (candidate.finishReason === 'SAFETY') {
    return "I can't answer that question. Please ask about Indian elections and voting process.";
  }

  return candidate.content?.parts?.[0]?.text || 'No response received.';
}
