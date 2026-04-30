# VoteSmart India — Election Process Education Assistant

> A smart, interactive AI assistant that helps Indian citizens understand the election process, timelines, and democratic procedures in an accessible and engaging way.

---

## 🗳️ Challenge Vertical

**Election Process Education** — Hack2Skill × Google Antigravity Challenge

---

## 🎯 What It Does

VoteSmart India is a web-based conversational assistant that:

- Answers questions about the **Indian election process** in plain language
- Explains **Lok Sabha, Rajya Sabha, and State Assembly** elections
- Covers **voter registration**, **ECI rules**, **EVMs/VVPAT**, and the **Model Code of Conduct**
- Provides an interactive **election timeline** sidebar
- Includes a **key terms glossary** for first-time voters
- Displays rotating **election trivia facts**
- Supports **Hindi and Telugu** via Google Translate integration

---

## 🧠 Approach & Logic

### AI Architecture
- Uses **Google Gemini 2.0 Flash** via the Generative Language API
- Maintains full **multi-turn conversation history** for contextual follow-up questions
- Custom **system prompt** scoped to Indian elections, ECI data, and constitutional articles
- Graceful **safety filtering** and error handling

### Google Services Used
| Service | Purpose |
|---|---|
| **Google Gemini API** (gemini-2.0-flash) | Core AI assistant — answering election queries |
| **Google Translate Widget** | Multilingual support — English, Hindi, Telugu |
| **Google Fonts** (Syne + Spectral) | Typography |

### Decision Logic
1. User submits a question via chat input or quick-topic button
2. Message appended to `conversationHistory` array (multi-turn context)
3. Full history + system prompt sent to Gemini API
4. Response rendered with lightweight markdown formatting
5. History updated with model's response for next turn

---

## 🏗️ How the Solution Works

```
index.html   → UI shell: header, hero, chat panel, sidebar, footer
data.js      → Static data: trivia facts array, Gemini system prompt
app.js       → Core logic: Gemini API calls, chat rendering, multi-turn state
```

**No build tools. No dependencies. Pure HTML/CSS/JS.**  
Works in any modern browser. Deployable to GitHub Pages with zero configuration.

---

## ⚙️ Setup Instructions

### 1. Get a Free Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key

### 2. Add Your API Key
Open `app.js` and replace line 3:
```js
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
// Replace with:
const GEMINI_API_KEY = "AIza...your-actual-key...";
```

### 3. Run Locally
```bash
# Option A: Python server
python3 -m http.server 8000
# Open http://localhost:8000

# Option B: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

### 4. Deploy to GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/votesmart-india.git
git push -u origin main
# Then: GitHub repo → Settings → Pages → Source: main branch
```

---

## 📋 Assumptions Made

- Users are Indian citizens (content scoped to Indian electoral system)
- Telangana/AP context used where regionally relevant (user base in Hyderabad)
- ECI data is accurate as of 2024 general elections
- Google Translate widget handles language switching client-side (no server needed)
- API key is client-side for demo purposes; in production, this would be proxied server-side

---

## 🔒 Security Considerations

- API key should be moved to a backend proxy in production
- Gemini safety settings configured to block harassment and hate speech
- No user data is stored or transmitted beyond Gemini API calls
- All external resources loaded over HTTPS

---

## ✅ Evaluation Criteria Met

| Criterion | Implementation |
|---|---|
| **Smart, dynamic assistant** | Gemini 2.0 Flash with multi-turn memory |
| **Logical decision making** | System-prompted to India-specific context |
| **Google Services** | Gemini API + Google Translate + Google Fonts |
| **Real-world usability** | Quick topics, glossary, timeline sidebar |
| **Clean, maintainable code** | 3-file architecture, commented, modular |
| **Accessibility** | Semantic HTML, keyboard navigation, readable fonts |
| **Security** | Safety filters, error handling, HTTPS |

---

## 📸 Features at a Glance

- 🤖 AI-powered Q&A on Indian elections
- 📅 Lok Sabha election timeline (visual)
- 📖 Key terms glossary (EVM, VVPAT, MCC, NOTA...)
- 💡 Rotating trivia facts (12 facts)
- 🌐 English / Hindi / Telugu language support
- ⌨️ Keyboard accessible (Enter to send)
- 📱 Mobile-responsive layout

---

*Built with ❤️ for Hack2Skill — Election Process Education Challenge*
