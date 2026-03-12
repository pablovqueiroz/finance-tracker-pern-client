# Finance Tracker Client

React + TypeScript frontend for the Finance Tracker PERN application.

## Overview

This client covers the full user-facing flow of the project: authentication, account management, transactions, saving goals, reports, invitations, profile management, and contact form integration.

## Live Demo

A live version of the client will be available here soon:

- `CLIENT_LIVE_DEMO_URL`

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Chart.js
- ExcelJS
- i18next
- CSS Modules

## Features

- Email/password authentication
- Google OAuth sign-in
- Profile editing, password update, avatar upload, and account deletion
- Multi-account workspace with member roles
- Transaction creation, editing, deletion, and bulk import
- Saving goals with balance movement tracking
- Reports with charts and Excel export
- Invitation inbox and sent/expired invite management
- Internationalization in English, Portuguese, and Spanish
- Responsive layout with desktop navigation and mobile menu

## Routes

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/profile`
- `/create-account`
- `/accounts`
- `/accounts/:accountId`
- `/accounts/:accountId/members`
- `/accounts/:accountId/transactions`
- `/invites`
- `/contact`
- `/reports`
- `/savings`
- `/accounts/:accountId/savings`
- `/accounts/:accountId/saving-goals`

## Project Structure

```txt
src/
  components/   reusable UI components
  config/       runtime config such as API base URL
  context/      auth and theme providers
  hooks/        custom hooks
  i18n/         i18n bootstrap and locale files
  pages/        route-level pages
  services/     API client setup
  styles/       global CSS, reset, and variables
  types/        shared frontend types
  utils/        view helpers
```

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root.

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

Notes:

- `VITE_API_URL` should point to the server API base path.
- If `VITE_API_URL` is not set, the app currently falls back to `http://localhost:5005/api` in `src/config/config.ts`, so setting it explicitly is recommended for local development.
- `VITE_GOOGLE_CLIENT_ID` is required for Google sign-in.
- `VITE_EMAILJS_PUBLIC_KEY` is required for the contact form.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Local Development

Start the Vite dev server:

```bash
npm run dev
```

Default local URL:

- `http://localhost:5173`

Make sure the backend is running and CORS allows the frontend origin.

## Build

```bash
npm run build
```

The production bundle is generated in `dist/`.

## Backend Integration

The client expects a backend exposing routes under `/api`, including:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/users/me`
- `PUT /api/users/me`
- `DELETE /api/users/me`
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/:accountId`
- `GET /api/accounts/:accountId/members`
- `PATCH /api/accounts/:accountId/members/:memberId`
- `GET /api/transactions/account/:accountId`
- `POST /api/transactions`
- `POST /api/transactions/bulk`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/transactions/summary/:accountId`
- `GET /api/transactions/analytics/:accountId`
- `GET /api/saving-goals/account/:accountId`
- `POST /api/saving-goals`
- `POST /api/saving-goals/:id/move-money`
- `GET /api/invites/received`
- `GET /api/invites/sent`
- `GET /api/invites/expired`

## Deployment Notes

The project can be deployed as a static Vite application on platforms such as Vercel.

Required production environment variables:

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
