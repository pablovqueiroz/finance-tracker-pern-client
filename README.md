# Finance Tracker (Frontend)

Frontend for Finance Tracker, built with React, TypeScript, and Vite.

## Live Demo

A live version of the application can be accessed here:

[Live Demo](LIVE_DEMO_LINK_HERE)

## Overview

This repository contains the web interface for the `finance-tracker-pern` project.
The app currently includes authentication, account management, member invites/removal, full transaction CRUD by account, dashboard quick actions, reports, improved onboarding content on the home page, and profile editing features.

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
- Public home page with:
  - clearer product explanation for new users
  - feature overview cards
  - step-by-step onboarding content
  - benefits section explaining the value of the app
- Dashboard with:
  - account carousel (switch between accounts)
  - swipe on mobile, drag with mouse on desktop, and desktop arrow controls
  - account balance in the balance card
  - account balance in account cards
  - transactions list for selected account
  - quick actions:
    - `+` opens "new income" for active account
    - `-` opens "new expense" for active account
  - personalized hero (`Hello {user.name}`)
- Manage transactions page (`/accounts/:accountId/transactions`) with:
  - create transaction (form opens on button click)
  - edit transaction (icon button inside card)
  - delete transaction (icon button inside card)
  - dynamic categories by transaction type (`INCOME` / `EXPENSE`)
  - title fallback: if title is empty, category is sent as title
- Profile page with:
  - name/gender update
  - password change
  - avatar upload
  - account deletion
- Mobile menu navigation

## UI Consistency

- Button alignment and spacing were reviewed across the main flows, including navigation, forms, profile actions, account management, invites, and contact sections.
- The layout fixes were implemented with a mobile-first approach so buttons stack, stretch, and align predictably on smaller screens before expanding on larger breakpoints.
- Excessive bottom spacing was reduced across page wrappers and sections to keep mobile screens tighter and reduce unnecessary scrolling.
- The dashboard account switcher now uses a swipeable carousel, making it easier to browse accounts on mobile while keeping the existing dashboard flow intact.
- The desktop navbar now uses a profile avatar trigger instead of rendering the username, which keeps the header more consistent and prevents long names from affecting the layout.
- The language switcher was updated to a cleaner dropdown-style control and the profile menus were reordered to prioritize the most frequently used actions.

## Loading System

- Spinner-based loading states were replaced with skeleton placeholders that better match the final UI structure.
- Skeleton loading improves perceived performance by keeping the layout stable while content is fetched.
- The loading states were adjusted to preserve mobile layout proportions and reduce visual shifts when data becomes available.

## Internationalization

- The frontend now includes internationalization support with `i18next`, `react-i18next`, and browser language detection.
- Supported languages are English, Portuguese, and Spanish, with English as the default fallback language.
- Language switching is available on the public home page and inside the authenticated interface through the profile and navigation menus.
- Post-i18n additions were reviewed so the newer home page onboarding content is also covered in Portuguese and Spanish.

## Routes

- `/` - Home
- `/login` - Login
- `/register` - Register
- `/dashboard` - Dashboard
- `/profile` - User profile
- `/create-account` - Create account
- `/accounts` - Accounts list
- `/accounts/:accountId` - Account details
- `/accounts/:accountId/transactions` - Manage transactions (CRUD)
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
- `GET /api/transactions/summary/:accountId`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `POST /api/invites`
- `DELETE /api/accounts/:accountId/members/:memberId`

## Related Repository

- Backend: <https://github.com/pablovqueiroz/finance-tracker-pern-server>
