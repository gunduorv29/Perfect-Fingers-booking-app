# 💇🏾‍♀️ Hairdressing Booking App

A full-stack hairdressing booking web app with client auth, appointment scheduling, service management, and an admin dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel |

---

## Features

- 🔐 **Authentication** — Signup, login, and unique client profiles via Supabase Auth
- 📅 **Booking System** — Clients can browse services and book appointments
- 👤 **Client Dashboard** — View upcoming/past appointments, manage profile
- 🛠️ **Admin Dashboard** — Manage appointments, services, and availability
- 💸 **Payment Info** — Zelle and Cash App details displayed at checkout
- 📸 **Gallery** — Showcases the stylist's work

---

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── booking/
│   ├── auth/
│   └── admin/
├── pages/
│   ├── Landing.jsx
│   ├── Services.jsx
│   ├── Book.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── dashboard/
│   │   └── Dashboard.jsx
│   └── admin/
│       └── AdminDashboard.jsx
├── lib/
│   └── supabaseClient.js
└── App.jsx
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- A [Supabase](https://supabase.com) account

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/hairdressing-booking-app.git
cd hairdressing-booking-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Get these from your Supabase project → Settings → API

### 4. Set up the database

Run the SQL scripts in `/supabase/schema.sql` inside your Supabase SQL Editor.

### 5. Start the dev server
```bash
npm run dev
```

---

## Database Schema

- `profiles` — Linked to Supabase auth users (name, phone, role)
- `services` — Hairdressing services (name, price, duration, image)
- `appointments` — Bookings linking clients to services with date/time/status

---

## Deployment

This app is deployed on **Vercel**.

To deploy:
1. Push to the `main` branch
2. Vercel auto-deploys on every push
3. Set environment variables in Vercel dashboard → Project Settings → Environment Variables

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — triggers auto-deploy |
| `dev` | Active development |

Always work on `dev` and merge to `main` when ready to go live.

---

## Payment

This app does not process payments directly. Clients are shown the stylist's:
- **Zelle** — phone number / email
- **Cash App** — $cashtag link

Clients are asked to include their name and service in the payment memo.

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public anon key |

---

## License

Private project. Not for redistribution.
