# SprintStudy — Persuasive Focus & Study Habit Platform

**Authors:** Guilherme Basílio (2100123), Carlos Santos (2128623), Samuel Pita (2114123), Duarte Ferro (2176624) <br>
**Institution:** University of Madeira <br>
**Course:** Persuasive Computing (2026/2027) <br>
**Date:** November 2026

---

An end-to-end persuasive web application designed and built to foster sustainable, distraction-free study habits among university students ("The Behaviour Change League"). 

**SprintStudy** encourages students to commit to uninterrupted **45-minute focused study blocks**, eliminating friction at entry while providing real-time behavioral telemetry, live $A/B$ experimentation, and meaningful gamification loops backed by a secure, server-side **Layered MVC Architecture**.

---

## Persuasive Design & Theoretical Framework

The platform's user journey and interface mechanics are explicitly grounded in five behavioral science and ethical design pillars:

### 1. Fogg Behavior Model ($B = MAP$)
- **Motivation:** Driven by social belonging and relief from academic procrastination through visible peer activity and continuous personal progress.
- **Ability:** Radical friction reduction (*1-Click Onboarding*). Users start their first study sprint immediately as anonymous guests via `HttpOnly` session cookies without mandatory account creation forms.
- **Prompt:** Contextual cues encouraging immediate action during typical study windows (*"Do you have 45 minutes free right now?"*) and tab-visibility alerts when focus drifts.

### 2. Cialdini’s Principles of Social Influence
- **Social Proof:** Real-time counter displaying active peers currently studying across the campus (*"Right now, X university students are studying in a Sprint"*).
- **Commitment & Consistency:** Before initiating the timer, users explicitly declare the exact micro-task they intend to complete (e.g., *"Solve Algorithms Worksheet 3"*), reinforcing internal accountability.
- **Reciprocity:** Immediate, barrier-free access to productivity utilities (integrated Lo-Fi focus audio streams and visual focus themes) upon starting a session, predisposing users to reciprocate by honoring their study commitment.

### 3. Kahneman’s System 1 Heuristics & Biases
- **Anchoring Effect:** The timer defaults to an optimal **45-minute standard**, establishing a clear cognitive reference point and removing decision fatigue.
- **Loss Aversion:** A daily study **Streak** counter motivates consistent daily return to preserve accumulated progress.

### 4. Meaningful Gamification (*Core Loop* & *Semester Climb*)
Moving beyond superficial points and badges, the platform implements a structured behavioral loop (*Trigger $\rightarrow$ Action $\rightarrow$ Variable Feedback $\rightarrow$ Investment*):
- **Focus Levels & Semester Climb (`SemesterClimb.js`):** Accumulated focus minutes translate into progressive academic milestones and analytical productivity insights (`AnalyticsDashboard.js`).

### 5. Ethical Charter & Anti-Manipulation Safeguards
- **Transparency & Autonomy:** Users retain full freedom to cancel or exit at any time without dark patterns, hidden subscriptions, or public social shaming.
- **Privacy by Design:** Minimal data collection using cryptographic anonymous UUIDs (`HttpOnly` cookies). Registration requires only a `username` and a salted SHA-256 hashed password—no emails, real names, or personal identifiers are collected.

---

## Experimental Protocol & Evidence Logging

To empirically validate behavioral impact over the 3-week live deployment:
- **Target Metric:** $\ge 30$ distinct real users outside the course completing at least one verified 45-minute study sprint.
- **Automated Telemetry:** Every session start (`started`), completion (`completed`), and abandonment (`cancelled`) is automatically logged server-side with exact timestamps (`started_at`, `completed_at`), anonymous `user_id`, and experimental group assignment.
- **Live $A/B$ Experiment:**
  - **Variant A (Control):** Clean interface displaying the task commitment input and 45-minute timer.
  - **Variant B (Persuasive Treatment):** Identical interface augmented with the live **Social Proof Banner** (`SocialProofBanner.js`).
  - **Comparison Metric:** Session completion rate ($\text{Completed} / \text{Started}$) across Variant A vs. Variant B, monitored live via the built-in `/analytics` dashboard.

---

## Architectural Design & Layered Structure

The application is built with **Next.js (App Router)** and **PostgreSQL (Supabase)** following a strict **Layered MVC Architecture** to prevent client-side data tampering and ensure experimental data integrity:

- **Presentation Layer (`app/**/page.js`, `components/`):** Pure React client views and UI components (`Timer`, `SocialProofBanner`, `SemesterClimb`, `AnalyticsDashboard`, `RegisterModal`) featuring automatic multilingual support via GTranslate.
- **Controller / API Gateway Layer (`app/api/`):** RESTful Next.js Route Handlers validating requests, managing `HttpOnly` session cookies, and orchestrating service calls.
- **Business Logic Layer (`services/`):** Encapsulates pure domain logic, including salted SHA-256 password hashing (`authService.js`), daily streak and focus level algorithms (`metricsService.js`), and $A/B$ statistical aggregations (`analyticsService.js`).
- **Data Access Layer (`models/`):** Isolates all PostgreSQL queries (`userModel.js`, `sessionModel.js`, `analyticsModel.js`) executed strictly on the server via the privileged `supabaseServer.js` client.

---

## Repository Structure

```text
sprintstudy/
├── app/
│   ├── api/                         # [CONTROLLERS] Server-side REST API routes
│   │   ├── analytics/route.js       # GET /api/analytics (A/B test & global telemetry)
│   │   ├── auth/route.js            # GET & POST /api/auth (guest init, register, login, logout)
│   │   ├── platform-stats/route.js  # GET /api/platform-stats (live campus metrics)
│   │   ├── profile/route.js         # GET /api/profile (user history, streaks & levels)
│   │   └── sessions/
│   │       ├── route.js             # GET (live active count) & POST (start 45m sprint)
│   │       └── [id]/route.js        # PATCH (complete or cancel active sprint)
│   ├── analytics/page.js            # [VIEW] Live experimental & A/B testing dashboard
│   ├── login/page.js                # [VIEW] Optional username/password account binding
│   ├── perfil/page.js               # [VIEW] Student profile, streak, focus level & history
│   ├── page.js                      # [VIEW] Landing page & main 45-minute sprint workspace
│   ├── layout.js                    # Global layout with Navbar & GTranslate integration
│   └── globals.css                  # Tailwind CSS global styles
├── components/                      # [VIEW] Modular UI components
│   ├── AnalyticsDashboard.js        # Real-time charts & A/B conversion comparison
│   ├── Navbar.js                    # Responsive navigation bar & user state indicator
│   ├── RegisterModal.js             # Post-sprint prompt for optional account persistence
│   ├── SemesterClimb.js             # Visual progression & milestone tracker
│   ├── SocialProofBanner.js         # Variant B live peer counter
│   └── Timer.js                     # 45-minute countdown, Lo-Fi audio & tab-focus monitor
├── services/                        # [SERVICES] Pure domain & business logic
│   ├── analyticsService.js          # Conversion rate calculations & experiment breakdowns
│   ├── authService.js               # Salted SHA-256 hashing & A/B cohort assignment
│   └── metricsService.js            # Daily streak computation & focus level progression
├── models/                          # [MODELS] Database abstraction layer
│   ├── analyticsModel.js            # Aggregated telemetry queries
│   ├── sessionModel.js              # CRUD operations for study sprints
│   └── userModel.js                 # User & guest profile persistence
├── lib/                             # Infrastructure & security utilities
│   ├── apiClient.js                 # Standardized frontend fetch wrapper
│   ├── sessionCookie.js             # HttpOnly cookie management
│   └── supabaseServer.js            # Privileged server-only Supabase client
├── public/assets/
│   └── logo.svg                     # Brand vector logo
├── query_tabelas.sql                # PostgreSQL schema & Row-Level Security (RLS) policies
├── testes_comandos.txt              # API & endpoint verification commands
├── .env.example                     # Required environment variables template
└── README.md                        # Project documentation
```

---

## Execution & Deployment Guide

### Prerequisites
- **Node.js** ($\ge 18.x$) and **npm**
- A **Supabase** project (PostgreSQL)

### 1. Database Setup
1. Open your Supabase project's **SQL Editor**.
2. Execute the schema and Row-Level Security policies provided in `query_tabelas.sql` to create the `users` and `sessions` tables.

### 2. Local Installation
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/basiliogod/sprintstudy.git
   cd sprintstudy
   npm install
   ```
2. Configure environment variables by copying `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials and cryptographic salt in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
   PASSWORD_SALT=your-random-secret-salt
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Deployment (Vercel)
1. Import the GitHub repository into **Vercel**.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `PASSWORD_SALT` under **Project Settings $\rightarrow$ Environment Variables**.
3. Deploy the `main` branch. Every subsequent push automatically triggers a zero-downtime production build.