<div align="center">

# CodeMentor

### A calmer way to get better at code.

Practice data structures and algorithms in a focused workspace. Learn from each attempt, build steady habits, and track progress at your own pace.

[Get started](#-get-started) · [Features](#-what-you-can-do) · [Architecture](#-how-it-fits-together) · [Commands](#-everyday-commands)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-111111?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/status-learning%20project-796BE7)

</div>

---

## ✨ What you can do

| Explore | Practice | Reflect |
| --- | --- | --- |
| Browse and filter a curated DSA library | Write Python 3, Java, or C++ in a Monaco-powered workspace | Review verdicts, diagnostics, and submitted source code |
| Follow guided learning paths | Run sample tests or bring your own input | Compare attempts and save private solution reflections |
| Save problems for later | Submit against hidden test cases using Judge0 | Track solved problems, accuracy, goals, and streaks |
| Reveal progressive hints and public edge cases | Practice debugging and step through algorithm visualizations | Review topic insights and your learning journal |

The interface includes a persistent light/dark theme, editor preferences, keyboard shortcuts, and focused practice sessions.

## 🧭 How it fits together

```mermaid
flowchart LR
    learner([Learner])
    subgraph client[React + Vite]
        pages[Pages and learning tools]
        editor[Monaco workspace]
        apiClient[API client]
    end
    subgraph server[Express API]
        auth[Authentication]
        problems[Problems and hints]
        submissions[Submission workflow]
    end
    database[(MongoDB)]
    judge[Judge0 CE]

    learner --> pages
    pages --> editor
    pages --> apiClient
    apiClient --> auth
    apiClient --> problems
    apiClient --> submissions
    auth <--> database
    problems <--> database
    submissions <--> database
    submissions --> judge
```

### What happens when code is submitted?

```mermaid
sequenceDiagram
    actor Learner
    participant UI as React workspace
    participant API as Express API
    participant DB as MongoDB
    participant Judge as Judge0 CE

    Learner->>UI: Submit code and choose a language
    UI->>API: Send authenticated submission
    API->>DB: Load problem test cases
    API->>Judge: Execute code in isolated runner
    Judge-->>API: Return execution results
    API->>API: Compare outputs and determine verdict
    API->>DB: Save attempt and source code
    API-->>UI: Return verdict and diagnostics
    UI-->>Learner: Show result and submission history
```

> **Execution safety:** submissions are sent to Judge0 CE, not run directly by the Express server. Hidden tests remain on the backend. The free public Judge0 service can be rate-limited or temporarily unavailable.

## 🛠️ Technology

- **Client:** React, Vite, React Router, Monaco Editor, and Lucide icons
- **API:** Node.js, Express, JWT authentication, and secure HTTP-only cookies
- **Data:** MongoDB with Mongoose
- **Code execution:** Free public Judge0 CE endpoint (no API key or RapidAPI host required by default)
- **Workspace:** npm workspaces for the client and server

## 🚀 Get started

### Prerequisites

- Node.js 20.19+ (or 22.12+) and npm
- MongoDB running locally, or a MongoDB connection string
- Internet access for Judge0 CE code execution

### 1. Install dependencies

Run this from the repository root:

```sh
npm install
```

### 2. Configure the API

Copy `server/.env.example` to `server/.env`, then set the values for your machine:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/codementor
JWT_SECRET=replace-this-with-a-long-random-secret-at-least-32-characters
CLIENT_ORIGIN=http://localhost:5173
```

Use a unique, private `JWT_SECRET` of at least 32 characters. Keep `.env` files private; the repository ignore rules exclude them. `JUDGE0_URL` is optional and only needed to override the default Judge0 CE endpoint.

### 3. Start MongoDB and seed the problem library

```sh
npm run seed
```

Seeding inserts or updates the built-in problems by slug, so it can also be used after pulling problem-data updates.

### 4. Start the app

```sh
npm run dev
```

This starts the Vite client and Express API together. Open the client URL printed in the terminal (normally [http://localhost:5173](http://localhost:5173)). The API health check is [http://localhost:5000/api/health](http://localhost:5000/api/health).

## 🧰 Everyday commands

Run commands from the repository root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the client and API in development mode |
| `npm run build` | Create the production client build |
| `npm run lint` | Lint the client |
| `npm run seed` | Seed or update the problem library |
| `npm test -w server` | Run the server tests |
| `npm start -w server` | Start the API without watch mode |

To run a workspace command directly:

```sh
npm run dev -w client
npm run dev -w server
```

## 🔐 Environment reference

| Variable | Required | Description |
| --- | :---: | --- |
| `PORT` | No | API port; defaults to `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Private signing secret; use at least 32 characters |
| `CLIENT_ORIGIN` | No | Allowed browser origin; defaults to `http://localhost:5173` |
| `JUDGE0_URL` | No | Judge0-compatible endpoint override; defaults to `https://ce.judge0.com` |

For production, serve the client over HTTPS, set `NODE_ENV=production`, and configure `CLIENT_ORIGIN` to the exact deployed client origin. Never commit secrets or real environment files.

## 🗂️ Project map

```text
CodeMentor/
├── client/
│   ├── public/                 # Static assets
│   └── src/
│       ├── components/         # Shared interface components
│       ├── context/            # Authentication and theme state
│       ├── pages/              # Product pages and coding workspace
│       └── services/           # API client
├── server/
│   ├── config/                 # Database connection
│   ├── controllers/            # API handlers
│   ├── data/                   # Seed problems and learning content
│   ├── middleware/             # Authentication and error handling
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API routes
│   ├── scripts/                # Database seed script
│   └── services/               # Judge0 integration and tests
├── package.json                # npm workspaces and root commands
└── README.md
```

## 🧪 Testing and privacy notes

- The backend test suite uses Node’s built-in test runner: `npm test -w server`.
- Problem detail responses omit hidden test cases; hints are fetched progressively.
- Per-problem submission history is scoped to the signed-in user. Source code is fetched only for an individual attempt.
- Reflections are private to the submitting user.
- Execution depends on the public Judge0 CE service and its availability and usage limits.

---

<div align="center">

**Progress, not perfection. One thoughtful attempt at a time.**

</div>
