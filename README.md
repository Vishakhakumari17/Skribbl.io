# 🎨 Skribble.io Clone — Full-Stack Multiplayer Drawing & Guessing Game

An end-to-end real-time multiplayer drawing and pictionary guessing game inspired by [skribbl.io](https://skribbl.io), built with **React**, **TypeScript**, **HTML5 Canvas**, **Node.js / Express**, and **Socket.IO**.

---

## 🚀 Live Demo & Deployment
- **Live Application URL**: *(Add your deployed Render / Railway / Vercel link here, e.g. `https://skribbl-clone.onrender.com`)*
- **GitHub Repository**: *(Add your GitHub repo URL here)*

---

## 🌟 Key Features

### 1. 👥 Room & Lobby Management
- **Create Private Rooms**: Host creates custom rooms with configurable rounds (2–10), draw time (30s–120s), and word categories.
- **Join via Code or Link**: Players can enter a 6-character room code or use quick-play random matchmaking.
- **Custom Avatars & Names**: Pick your favourite avatar from an interactive selector.
- **Lobby Sync**: Real-time connected players counter and host controls to start the game.

### 2. 🖌️ Real-time Drawing Canvas
- **HTML5 Canvas Engine**: Responsive, high-resolution rendering with vector normalization so strokes look identical across all screen resolutions and devices.
- **Drawing Tools**:
  - Pen / Brush tool with 12 vibrant colors.
  - 4 Brush thickness sizes (thin to extra-thick).
  - Eraser mode with smooth stroke clearing.
  - **Undo**: Instantly undoes previous strokes.
  - **Clear Canvas**: One-click wipe for the active drawer.
- **Sub-50ms Sync**: Strokes stream live to all players via WebSockets using normalized coordinates.

### 3. 🎯 Word System & Secret Selection
- **Turn-based Rotation**: Every player gets an equal turn to draw.
- **Drawer Word Choice**: Drawer chooses 1 out of 3 randomized words from diverse categories (Animals, Food, Objects, Nature, or Custom words).
- **Secret & Blanks**:
  - Drawer sees the exact word.
  - Guessers see blank letter slots (e.g. `_ _ _ _ _`).
  - **Dynamic Hints**: Letters automatically reveal at specific intervals (60% and 30% time remaining).

### 4. 💬 Guessing, Chat & Scorer
- **Smart Guess Matching**: Case-insensitive and trimmed checking.
- **Levenshtein Distance "Close Guess" Hint**: If a player has a 1-letter typo, they receive a private notification: *"is very close!"*.
- **Fair Time-Decay Scoring**: Faster guesses earn higher points (up to 500 pts). The drawer also earns bonus points when players guess correctly.
- **Winner Podium & Confetti Celebration**: End-of-game celebration modal highlighting 1st, 2nd, and 3rd place with celebratory confetti.

---

## 🏗️ Architecture & OOP Design

The backend uses structured **Object-Oriented Programming (OOP)** patterns for clean separation of concerns and maintainability:

```
skribbl.io/
├── client/                      # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── DrawingCanvas.tsx # HTML5 Canvas with normalized stroke streaming
│   │   │   ├── ChatBox.tsx       # Live chat, guesses, and close-guess alerts
│   │   │   ├── PlayerList.tsx    # Live scoreboard and turn indicators
│   │   │   ├── GameHeader.tsx    # Word blanks, rounds, and countdown timer
│   │   │   ├── LobbyView.tsx     # Room configuration & host start panel
│   │   │   ├── HomeScreen.tsx    # Avatar picker, room creation & join modal
│   │   │   ├── GameOverModal.tsx # Winner podium with confetti animation
│   │   │   └── WordPickerModal.tsx # Drawer word selection dialog
│   │   ├── services/
│   │   │   └── socket.ts         # Socket.IO client singleton
│   │   └── types.ts              # Shared frontend TypeScript interfaces
│   └── vite.config.ts
│
└── server/                      # Node.js + Express + Socket.IO + TypeScript
    ├── src/
    │   ├── models/
    │   │   ├── Room.ts           # OOP Room entity: turns, state, timers, scoring
    │   │   ├── RoomManager.ts    # Manages active rooms and matchmaking
    │   │   └── WordManager.ts    # Word banks, categorization, and fuzzy-matching
    │   ├── types.ts              # Server state contracts
    │   └── index.ts              # Express API & WebSocket event handlers
    └── tsconfig.json
```

---

## 📡 WebSocket Event Specifications

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `create_room` | Client ➔ Server | `{ playerName, avatar, settings }` | Host initializes a new room |
| `join_room` | Client ➔ Server | `{ roomId, playerName, avatar }` | Join room by code or `RANDOM` |
| `start_game` | Client ➔ Server | `{}` | Host initiates first round |
| `choose_word` | Client ➔ Server | `{ word }` | Drawer selects their chosen word |
| `draw_stroke` | Client ➔ Server ➔ Clients | `DrawStroke` (coordinates, color, size) | Real-time stroke broadcasting |
| `draw_undo` | Client ➔ Server ➔ Clients | `{}` | Drawer undos the previous stroke |
| `canvas_clear`| Client ➔ Server ➔ Clients | `{}` | Drawer clears the drawing canvas |
| `send_chat` | Client ➔ Server | `{ text }` | Guess or chat message |
| `game_state` | Server ➔ Client | `GameState` | Synchronized room & game state |

---

## 💻 Local Setup & Installation

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/skribble-clone.git
cd skribble-clone
```

### 2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Run the development environment
Open two terminals:

**Terminal 1 (Backend Server on Port 4000):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client on Port 5173):**
```bash
cd client
npm run dev
```

Now open [http://localhost:5173](http://localhost:5173) in your browser. Open an Incognito window to simulate Player 2 and test real-time multiplayer drawing!

---

## ☁️ Deployment Guide

### Option 1: Deploy on Render (Full-Stack)
1. Fork or push this repository to GitHub.
2. Sign in to [Render](https://render.com) and create a **Web Service**.
3. Select your repository.
4. Set:
   - **Environment**: `Node`
   - **Build Command**: `cd client && npm install && npm run build && cd ../server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
5. Render will automatically expose the full-stack app on a public URL with native WebSocket support!

### Option 2: Deploy Frontend on Vercel + Backend on Render/Railway
- **Backend (Render/Railway)**: Deploy the `server/` directory as a Web Service.
- **Frontend (Vercel)**: Deploy the `client/` directory and set the environment variable:
  `VITE_BACKEND_URL=https://your-backend.onrender.com`
