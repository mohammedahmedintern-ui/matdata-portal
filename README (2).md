# 🇮🇳 MatDan Portal

## Overview

MatDan Portal is an interactive election assistant that guides Indian citizens through the voting process using a step-by-step wizard and personalised decision logic.

**"MatDan"** (मतदान) is the Hindi word for voting — the name reflects the app's purpose directly.

The system adapts to user inputs — age, registration status, voting experience, and location — to provide tailored guidance on eligibility, registration, and voting procedures.

---

## Problem Statement

Many citizens, especially first-time voters, lack clarity about:
- Eligibility requirements
- Voter registration steps
- Polling day procedures

This leads to confusion, missed votes, and reduced civic participation.

---

## Solution

MatDan Portal simplifies the election process by acting as a smart assistant that:
- Determines eligibility
- Guides users through registration or voting steps
- Adapts advice based on user persona
- Provides a clear checklist and reminders
- Displays rotating election facts to build civic awareness (differentiating feature)

---

## Core Features

### 1. Interactive Wizard
- Step-by-step guided flow
- Collects: age, registration status, first-time voter status, location
- Visual progress indicator

### 2. Decision-Based Logic
- Under 18 → future voter eligibility guidance
- Not registered → ECI registration steps (Form 6, voters.eci.gov.in)
- Registered → polling day checklist
- Adapts for first-time voters, experienced voters, senior citizens

### 3. Rotating Election Facts (Differentiating Feature)
- 12 curated, real facts about Indian elections
- Displayed in the sidebar with a "Next fact" button
- Builds civic literacy beyond the immediate wizard flow
- Tracked via Google Analytics (`fact_viewed` event)

### 4. Voting Reminder System
- Users set a polling day date reminder
- Stored in localStorage; persists across reloads

---

## Google Services Integration

| Service | Usage |
|---|---|
| **Firebase Firestore** | Stores anonymised user interactions; retrieves live user count |
| **Google Analytics (gtag.js)** | Tracks: `app_init`, `step_view`, `guidance_shown`, `reminder_saved`, `fact_viewed` |

---

## Tech Stack

- HTML, CSS, Vanilla JavaScript
- Firebase Firestore (via CDN)
- Google Analytics (via CDN)
- Deployed on **Vercel** (free tier)

---

## Setup

### 1. Add Firebase config
Open `script.js` line 2–5, replace `"..."` with your Firebase project values from the Firebase Console.

### 2. Add Google Analytics ID
Open `index.html`, replace `G-XXXXXXXXXX` with your actual Measurement ID.

### 3. Run tests locally
```bash
npm test
```

### 4. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Follow the prompts. Your live URL will be shown immediately.

---

## Testing

64 test cases across 13 groups covering:

| Group | Area |
|---|---|
| 1 | `getEligibility` — age checks |
| 2 | `getGuidance` — decision branches |
| 3 | Edge cases — NaN, null, empty |
| 4 | `escapeHtml` — XSS prevention |
| 5 | `formatDate` — date formatting |
| 6 | Steps configuration integrity |
| 7 | `appState` — initial state |
| 8 | `getStepStatus` — progress tracking |
| 9 | `getUserDataForStorage` — data shape |
| 10 | `buildGuidance` — full output |
| 11 | `renderSeniorBox` — conditional render |
| 12 | Firebase config validation |
| 13 | `showMessage`/`clearMessage` |

---

## Accessibility

- Semantic HTML with ARIA labels and roles
- Keyboard navigation and focus management
- High-contrast colour palette (deep navy + amber + teal)
- Responsive layout for mobile and desktop

---

## Security

- No sensitive personal data collected
- Input validated and XSS-escaped via `escapeHtml()`
- Firebase uses anonymised data only
- Replace Firebase/GA placeholders before production

---

## Assumptions

- Users provide approximate location (city/state)
- Firebase configuration is properly set before production use
- Google Analytics ID is replaced with actual measurement ID

---

## Project Structure

```
├── index.html      # Main HTML — GA + Firebase CDN
├── script.js       # Core logic + Firebase + Analytics
├── style.css       # Responsive UI — navy/amber/teal palette
├── test.js         # 64 unit tests (plain JavaScript)
├── Dockerfile      # Optional container deployment
├── package.json    # npm test script
└── README.md       # This file
```

---

*Built for Hack2Skill — Election Process Education Challenge*
