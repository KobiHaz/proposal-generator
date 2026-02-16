# Proposal Generator

A React-based proposal and quote generator application with a right-to-left (RTL) Hebrew interface.

## Features

- **Quote creation** – Build professional quotes with client and developer details
- **Payment models** – Support for fixed price and hourly rate pricing
- **Fixed price** – Advance, beta, and final payment percentages
- **Hourly** – Hourly rate and estimated hours
- **Maintenance** – Monthly retainer amount
- **Support** – Support hourly rate and warranty period
- **Terms** – Timeline, cancellation, client obligations, browser support, and exclusions
- **Quote document** – Generate a formatted quote document from the form data

## Tech Stack

- **React 19** with **TypeScript**
- **Vite** – Build tool and dev server
- **Tailwind CSS v4** – Styling
- **Radix UI** – Accessible UI components (Label, Radio Group, Separator, etc.)
- **Lucide React** – Icons
- **date-fns**, **clsx**, **tailwind-merge**, **class-variance-authority** – Utilities

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

The app runs at [http://localhost:8085](http://localhost:8085).

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── main.tsx           # App entry
├── App.tsx            # Root component
├── index.css          # Global styles
├── lib/
│   └── utils.ts       # Utilities (e.g. cn)
├── components/
│   └── ui/            # Reusable UI components (Button, Card, Input, etc.)
└── projects/
    ├── types.ts       # QuoteData and related types
    ├── QuotePage.tsx  # Main quote page
    ├── QuoteForm.tsx  # Quote form
    └── QuoteDocument.tsx # Rendered quote document
```

## Configuration

- **Vite** – `vite.config.ts` (port 8085, `@/` alias to `src/`)
- **Maestro** – `maestro/maestro.config.json` for project and workflow metadata

## Pushing to GitHub

The project is already a Git repo with an initial commit. To push to GitHub:

1. Create a new repository on GitHub (do not initialize with README).
2. Add the remote and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/proposal-generator.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## License

Private project.
