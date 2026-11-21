# 🔫 Grand Theft Crew ($GRAND) Auto-Farm Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Ecosystem](https://img.shields.io/badge/Solana-Airdrop-14F195.svg)](https://solana.com/)
[![Stealth Engine](https://img.shields.io/badge/Anti--Cheat-Humanized%20Replay-blueviolet.svg)](#-anti-bot-reverse-engineering--stealth-engine)

An enterprise-grade, fully automated multi-wallet farming suite and deterministic game engine replayer for the **Grand Theft Crew ($GRAND)** Solana airdrop campaign ([play.grandtheftcrew.com](https://play.grandtheftcrew.com)).

Built with zero-dependency native Node.js (ESM), featuring automatic referral clustering, deterministic game replay simulation with wall-clock pacing, Gaussian reflex latency, invisible trap filtering, and a polished 99-column CLI interface.

---

## ⚡ Core Capabilities

- **Zero-Config Execution (`npm start`)**: Handles authentication, referral hierarchy, task verification, daily check-ins, score boosting, and leaderboard reporting in one single pass.
- **Autonomous Master Referral Tree**: Automatically links Wallet #1 as the master inviter and chains all subsequent wallets underneath it, harvesting maximum daily referral rewards (+15,000 pts/day).
- **Instant Task Claiming**: Verifies and claims one-time and recurring server tasks:
  - Follow X/Twitter Mission (**+2,000 pts** per wallet)
  - Daily Check-in Unlock & Claim (**+500 pts** daily per wallet)
- **High-Score Stealth Booster (~24,000+ Pts)**: Simulates a complete Level 1 campaign run (Vice Beach Runner + Assault Boss *El Chulo*), elevating accounts from baseline (~3,500 pts) straight into the **Top Global Leaderboard**.
- **Ghost Honeypot Shield**: Filters out invisible server-side honeypots (`e.ghost`) with a 20px protective buffer to ensure 100% server replay acceptance.
- **Humanized Biometric Dispersion**:
  - Gaussian reaction latencies (300 ms – 430 ms)
  - Natural aim tremor ($\pm 4\text{px}$)
  - Organic headshot/bodyshot ratio (80% / 20%)
  - Natural accuracy breaking to prevent robotic 100% precision heuristic triggers
- **Zero Private Keys Required**: Operates strictly using Solana public addresses (`Base58`, 32–44 characters). Your funds and seed phrases are completely safe.
- **Terminal Precision**: Clean, non-hanging execution with a formatted 99-character colored summary card and leaderboard ranks.

---

## 🏗️ Architecture & Replay Lifecycle

```
[ wallets.txt ]  ──►  [ Multi-Wallet Parser ]
                            │
                            ▼
              [ API Layer: /vice-api/api/player ]
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
  [ Master Wallet #1 ]                 [ Referee Wallets #2..N ]
(Referral Code: jt8ydc)             (Bound under Master Referral)
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
           [ Game Engine Replay Simulation ]
             • Vice Beach Runner (1,100 m)
             • Assault Stops 1 - 3 (Quotas: 6, 8, 10)
             • Boss Stop 4: El Chulo (HP: 12)
                            │
                            ▼
             [ 60 FPS Heartbeat Synchronization ]
               • Real wall-clock elapsed pacing
               • Continuous /api/run/beat delivery
                            │
                            ▼
          [ /api/run/finish Submission & Verification ]
             • Status: 'accepted'
             • Best Score: ~24,000+ Pts
             • Global Leaderboard: Top Rank Tier
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher.
- A list of Solana public wallet addresses.

### 1. Installation
Clone the repository and install dependencies (if any):
```bash
git clone https://github.com/your-username/grandtheftcrew-auto.git
cd grandtheftcrew-auto
npm install
```

### 2. Configure Wallets
Copy the template file to `wallets.txt`:
```bash
cp wallets.example.txt wallets.txt
```
Edit `wallets.txt` and paste your Solana public wallet addresses (one per line):
```text
7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
3bB8yQ1Y5bM8z7tQ8V9kL4mJ3pX2wR1z6yT8vN5sD4fG
```
> [!IMPORTANT]
> **Wallet #1 (Line 1)** will automatically become your **Master Referral Account**. All other wallets (Lines 2..N) will register using its code.
> **DO NOT** enter private keys or seed phrases! Only public addresses are needed.

### 3. Launch Farm Suite
Run the bot with a single command:
```bash
npm start
```
The suite will process all wallets sequentially, print a summary table, and terminate cleanly (`exit 0`).

---

## ⚙️ Running Modes

| Command | Description | Behavior |
| :--- | :--- | :--- |
| `npm start` | **Single-Pass Run** | Executes tasks, check-in, and high-score boosts once, outputs summary table, and exits. |
| `npm run loop` | **24/7 Standby Mode** | Executes full pass, calculates exact wait duration until 00:05 UTC (07:05 WIB) reset, sleeps, and repeats daily. |

---

## 🛡️ Anti-Bot Reverse Engineering & Stealth Engine

The Grand Theft Crew server enforces a deterministic replay engine to validate scores before accepting them onto the global leaderboard:

1. **Ghost Honeypots (`e.ghost`)**:
   The game spawns invisible bait entities that are never rendered on screen. Naive bots that shoot based purely on game memory hit these targets, tripping `s.ghostHits++` and resulting in an immediate rejection (`Partida no válida: no cuenta`).
   - *Defense*: Our engine deploys a **20px Ghost Buffer** (`wouldHitGhost`), checking geometric bounding intersections across both foreground and background depths before firing.

2. **Heartbeat Beat Stream (`/api/run/beat`)**:
   The server monitors real-time elapsed time against logical ticks (60 ticks = 1 wall-clock second). Scores submitted without proportional real-world time or with dropped input packets are instantly rejected.
   - *Defense*: The engine implements strict wall-clock throttling (`Date.now() - startTime >= (ticks / 60) * 1000`) and streams input chunks sequentially every second.

3. **Natural Human Biometrics**:
   Unnatural 100% accuracy streaks (e.g. 33/33 consecutive headshots) trigger server-side heuristic filters.
   - *Defense*: Natural aim dispersion ($\pm 4\text{px}$), realistic human reflex delays (18–26 ticks), and calculated stray shots keep accuracy within a natural human window (~88%–94%), ensuring authentic gameplay patterns.

---

## 🔒 Security & Privacy (OPSEC)

- **Ignored Files**: `accounts.json`, `wallets.txt`, `.env`, and private session files are permanently excluded in `.gitignore`.
- **Zero Sensitive Data in Code**: No wallet addresses, referral links, or private tokens are hardcoded in the codebase.
- **Sanitized Storage**: `accounts.json` is generated locally on runtime using atomic write operations (`.tmp` -> `fs.renameSync`) to prevent file corruption during sudden shutdowns.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

---

## ⚠️ Disclaimer

This software is developed strictly for educational, security auditing, and research purposes into deterministic game client/server synchronization architectures. The authors assume no liability for misuse, account penalties, or actions taken by third-party game operators.
