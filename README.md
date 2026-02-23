# Finance Tracker (Frontend)

Frontend client for the Finance Tracker app, built with React, TypeScript, and Vite.

## Overview

This project contains the UI layer for a PERN-based finance tracker. It currently includes a mobile-first home dashboard with reusable components and context providers for theme and authentication state.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Axios
- CSS Modules

## Current Routes

- `/home` - main dashboard page

Note: menu links for wallet, create, savings, and profile are present in the UI, but their pages are not wired in `App.tsx` yet.

## Project Structure

- `src/pages` - page-level views
- `src/components` - reusable UI components
- `src/context` - app-level providers (auth/theme)
- `src/hooks` - custom React hooks
- `src/config` - runtime config values
- `src/styles` - global and shared styles

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
# Backend host (without /api)
VITE_API_URL=http://localhost:5005
```

Recommended value:

- `VITE_API_URL=http://localhost:5005`

Reason: the frontend currently calls endpoints like `${API_URL}/api/auth/verify` (`src/context/AuthContext.tsx`), and the backend already exposes routes under `/api/*`.

If `VITE_API_URL` is not defined, the frontend falls back to `http://localhost:5005/api` (`src/config/config.ts`).

## Available Scripts

```bash
npm run dev      # start development server
npm run build    # type-check and create production build
npm run preview  # preview production build locally
npm run lint     # run ESLint
```

## Running the App

```bash
npm run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).

## Backend Integration

Expected local setup:

- Backend server running on `http://localhost:5005`
- Backend CORS origin (`ORIGIN`) set to `http://localhost:5173`
- Backend routes mounted with `/api/*` (for example: `/api/auth/login`, `/api/users/me`)

Current client auth check:

- `GET ${API_URL}/api/auth/verify` with `Authorization: Bearer <token>`

## Status

The project is in active development and still has placeholder components and in-progress routes.

## Related Repository

- Backend (server): https://github.com/pablovqueiroz/finance-tracker-pern-server

