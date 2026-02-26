# Finance Tracker (Frontend)

Frontend for Finance Tracker, built with React, TypeScript, and Vite.

## Overview

This repository contains the web interface for the `finance-tracker-pern` project.
The app currently includes authentication, account management, a dashboard with account carousel + transactions, and profile editing features.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Axios
- CSS Modules

## Current Features

- Token-based authentication stored in `localStorage` (`authToken`)
- Google OAuth login/register (`POST /auth/google`)
- Authenticated user check via `GET /users/me`
- Accounts flow:
  - create account
  - list accounts
  - account details (members, transactions, saving goals)
- Dashboard with:
  - account carousel (switch between accounts)
  - transactions list for selected account
  - quick actions and hero section
- Profile page with:
  - name/gender update
  - password change
  - avatar upload
  - account deletion
- Mobile menu navigation

## Routes

- `/` - Home
- `/login` - Login
- `/register` - Register
- `/dashboard` - Dashboard
- `/profile` - User profile
- `/create-account` - Create account
- `/accounts` - Accounts list
- `/accounts/:accountId` - Account details
- `*` - Not Found

## Project Structure

- `src/pages` - application pages
- `src/components` - reusable components
- `src/context` - global providers (`Auth`, `Theme`)
- `src/hooks` - custom hooks
- `src/config` - configuration (e.g., API base URL)
- `src/styles` - global styles and variables

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5005/api
```

Important note:

- The frontend builds URLs in the format `${API_URL}/users/me`.
- So for a backend exposing routes under `/api/*`, `VITE_API_URL` must include `/api`.
- If not set, the fallback is already `http://localhost:5005/api`.

## Available Scripts

```bash
npm run dev      # start development server
npm run build    # type-check + production build
npm run preview  # preview production build
npm run lint     # run ESLint
```

## Running Locally

```bash
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## Backend Integration

Expected local setup:

- Backend running at `http://localhost:5005`
- API routes exposed under `/api/*`
- Backend CORS allowing `http://localhost:5173`

Examples of endpoints used by the frontend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/users/me`
- `PUT /api/users/me`
- `DELETE /api/users/me`
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/:accountId`
- `GET /api/transactions/account/:accountId`

## Related Repository

- Backend: <https://github.com/pablovqueiroz/finance-tracker-pern-server>
