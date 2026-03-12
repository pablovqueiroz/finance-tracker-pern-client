# Finance Tracker Frontend

Frontend for the Finance Tracker project, built with React, TypeScript, and Vite.

## Overview

This application provides the client interface for a personal finance tracker with account-based organization, shared access, saving goals, analytics, and multilingual support.

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

## Main Features

- Authentication with token persistence in `localStorage`
- Google OAuth integration
- Account creation and account detail management
- Shared accounts with members and invite flows
- Transaction management with:
  - create, edit, and delete flows
  - category-aware forms
  - local search and category filtering
- Saving goals with progress tracking and movement history
- Reports with:
  - income vs expenses
  - income and expense category charts
  - balance history
  - saving goal progress insights
  - Excel export with summary sheets and report datasets
- Reusable floating toast notifications for success and error feedback
- Internationalization in English, Portuguese, and Spanish
- Responsive dashboard with account carousel and quick actions

## Routes

- `/` - Home
- `/login` - Login
- `/register` - Register
- `/dashboard` - Dashboard
- `/profile` - User profile
- `/create-account` - Create account
- `/accounts` - Accounts list
- `/accounts/:accountId` - Account details
- `/accounts/:accountId/members` - Account members
- `/accounts/:accountId/transactions` - Transactions
- `/invites` - Invites
- `/reports` - Reports
- `/contact` - Contact
- `/savings` - Saving goals
- `/accounts/:accountId/savings` - Saving goals for a specific account
- `/accounts/:accountId/saving-goals` - Alternate saving goals route

## Project Structure

- `src/components` - reusable UI building blocks
- `src/pages` - page-level route components
- `src/hooks` - custom hooks
- `src/context` - app providers
- `src/services` - API client setup
- `src/config` - runtime configuration
- `src/i18n` - translations and i18n setup
- `src/styles` - global styles and design tokens

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
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

Notes:

- `VITE_API_URL` must include the `/api` prefix if the backend exposes routes under `/api/*`.
- If `VITE_API_URL` is not set, the frontend falls back to `http://localhost:5005/api`.
- `VITE_GOOGLE_CLIENT_ID` is required for Google OAuth.
- `VITE_EMAILJS_PUBLIC_KEY` is required for the contact form integration.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Local Development

```bash
npm run dev
```

By default, Vite runs on `http://localhost:5173`.

## Production Build

```bash
npm run build
```

The production output is generated in the `dist` directory.

## Vercel Deployment

This project is ready to be deployed on Vercel.

Recommended Vercel settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Required environment variables in Vercel:

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

The repository includes `vercel.json` with an SPA rewrite so direct navigation to client-side routes works correctly.

## Backend Integration

Expected backend setup:

- Backend API available under `/api`
- CORS configured for the frontend origin
- Auth endpoints enabled for token and Google login flows

Examples of endpoints consumed by the frontend:

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
- `GET /api/transactions/account/:accountId`
- `GET /api/transactions/summary/:accountId`
- `GET /api/transactions/analytics/:accountId`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/saving-goals/account/:accountId`
- `POST /api/invites`

## Related Repository

- Backend: <https://github.com/pablovqueiroz/finance-tracker-pern-server>
