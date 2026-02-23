# Proposal Generator

A React-based proposal and quote generator application with a right-to-left (RTL) Hebrew interface.

**Repository:** [github.com/Kobi-LeadsLords/proposal-generator](https://github.com/Kobi-LeadsLords/proposal-generator)

## Features

- **Four document types** – Tab-based navigation between:
  - **הצעת מחיר CRM** – Price proposal for CRM projects
  - **הצעת מחיר אוטומציות** – Price proposal for automation projects
  - **הסכם CRM** – Engagement agreement for CRM (development)
  - **הסכם אוטומציות** – Engagement agreement for automation (integration)
- **Price proposals** – Flexible structure: intro, technical spec, base package, add-ons, pricing table, blockers
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
    ├── types.ts         # QuoteData, ProposalData, and related types
    ├── presets.ts       # Agreement presets (CRM vs Automation)
    ├── TabNav.tsx       # Four-tab navigation
    ├── QuotePage.tsx    # Agreement page
    ├── QuoteForm.tsx    # Agreement form
    ├── QuoteDocument.tsx # Agreement document
    ├── ProposalPage.tsx   # Price proposal page
    ├── ProposalForm.tsx   # Price proposal form
    └── ProposalDocument.tsx # Price proposal document
```

## Configuration

- **Vite** – `vite.config.ts` (port 8085, `@/` alias to `src/`)
- **Maestro** – `maestro/maestro.config.json` for project and workflow metadata

## Repository

Clone the project:

```bash
git clone https://github.com/Kobi-LeadsLords/proposal-generator.git
cd proposal-generator
```

## License

Private project.
