# Swarajya CRM Frontend

A Vue 3 and Vite frontend for the MongoDB-backed Swarajya CRM platform.

## Features

- Customer records with contact details, industry, status, and notes
- Sales opportunities with value, stage, expected close date, requirements, and next action
- Projects with client requirements, delivery timeline, delivery status, owner, and latest update
- Dashboard for pipeline value, open opportunities, active projects, and upcoming deliveries
- Filtering for customers, opportunities, and projects

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

## API configuration

Development API requests are proxied to the backend on port `5001`. Production reads:

- `VITE_API_BASE_URL`

Build the frontend with:

```bash
npm run build
```
