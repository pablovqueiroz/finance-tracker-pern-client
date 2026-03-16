# Budgetivo Frontend

Frontend application for Budgetivo, a collaborative personal finance platform for account management, transactions, saving goals, reports, invitations, and profile management.

## Live Demo

### Try It Live

[Open Budgetivo Live Demo](https://budgetivo.vercel.app/)

## Related Repositories

- Frontend: [https://github.com/pablovqueiroz/finance-tracker-pern-client](https://github.com/pablovqueiroz/finance-tracker-pern-client)
- Backend: [https://github.com/pablovqueiroz/finance-tracker-pern-server](https://github.com/pablovqueiroz/finance-tracker-pern-server)

## Overview

This frontend delivers the full user-facing experience of the platform:

- authentication with email/password and Google OAuth
- dashboard with account carousel and quick actions
- account creation, account details, and collaborative membership
- transaction management, including bulk input and editing modal flows
- saving goals creation, movement tracking, and progress analytics
- reports with charts and Excel export
- invitations inbox plus sent and expired invite management
- profile editing, password changes, avatar upload, and account deletion
- multilingual UX in English, Portuguese, and Spanish
- responsive desktop and mobile navigation

## Why This Project Matters

This project showcases practical frontend engineering skills that are relevant to product teams and hiring managers:

- building a complete React application with real business flows instead of isolated demo components
- integrating external services such as Google OAuth and EmailJS
- designing authenticated and role-aware user experiences
- handling charts, data export, internationalization, and responsive UI in one product
- structuring a scalable codebase with reusable components, typed APIs, and modular utilities
- shipping a production deployment with a live demo

## Frontend Stack

### Core

- React 19
- TypeScript
- Vite
- React Router DOM

### Data, Auth, and Integrations

- Axios
- Google OAuth via `@react-oauth/google`
- EmailJS contact integration via `@emailjs/browser`

### Charts, Export, and UI Helpers

- Chart.js
- `react-chartjs-2`
- ExcelJS
- `react-icons`
- `react-spinners`

### Internationalization

- i18next
- `react-i18next`
- `i18next-browser-languagedetector`

### Tooling

- ESLint
- `typescript-eslint`
- `@vitejs/plugin-react-swc`

## Main Frontend Libraries

- `react`
- `react-dom`
- `react-router-dom`
- `axios`
- `i18next`
- `react-i18next`
- `i18next-browser-languagedetector`
- `chart.js`
- `react-chartjs-2`
- `exceljs`
- `react-icons`
- `react-spinners`
- `@react-oauth/google`
- `@emailjs/browser`
- `vite`
- `typescript`
- `eslint`

## Features

### Authentication and User Profile

- email/password register and login
- Google sign-in with OAuth
- profile update flow
- password update flow
- avatar upload
- account deletion with reauthentication support

### Accounts and Collaboration

- multi-account support
- account balances and summary metrics
- member roles: Owner, Admin, Viewer
- member management page
- invite flows for collaboration
- localized invite share modal with copy, email, SMS, WhatsApp, and native share options
- manual invite delivery flow that keeps backend invite creation unchanged

### Transactions

- create, edit, and delete transactions
- bulk transaction input
- downloadable bulk template
- localized labels with backend-safe enum codes
- category filtering and search
- connected date range filters and always-available category options, including Insurance

### Saving Goals and Reports

- create and edit saving goals
- move money in and out of goals
- progress indicators and analytics
- compact account switcher on savings and transaction management pages
- income vs expense charts
- category breakdown charts
- saving goal charts and progress tracking
- balance history chart
- Excel export with summary, goals, movements, balance history, and transactions

### UX

- responsive layout
- modal-based editing flows
- mobile menu
- loading states with skeletons/spinners
- translated UI
- integrated contact flow with EmailJS

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
  config/       runtime config and environment helpers
  context/      auth and theme providers
  hooks/        custom hooks
  i18n/         i18n bootstrap and locale files
  pages/        route-level pages
  services/     API client setup
  styles/       global CSS, reset, and variables
  types/        shared frontend types
  utils/        formatters, labels, and transaction helpers
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### Notes

- `VITE_API_URL` should point to the backend API base URL.
- `VITE_GOOGLE_CLIENT_ID` is required for Google sign-in.
- `VITE_EMAILJS_PUBLIC_KEY` is required for the contact form.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Local Development

Default local URL:

- `http://localhost:5173`

Make sure the backend is running and configured to allow the frontend origin.

## Deployment

This project is deployed as a Vite frontend.

- Production URL: [https://budgetivo.vercel.app/](https://budgetivo.vercel.app/)
- Suggested platform: Vercel

## Recruiter Notes

If you are reviewing this project as part of a hiring process, this frontend demonstrates:

- production-oriented React + TypeScript development
- API integration with an external backend
- third-party integrations including Google OAuth and EmailJS
- data visualization with Chart.js
- spreadsheet export with ExcelJS
- multilingual UX and responsive design
- collaboration features, permissions, and role-aware flows

Required production environment variables:

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
