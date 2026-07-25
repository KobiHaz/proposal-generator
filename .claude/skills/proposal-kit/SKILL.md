---
name: proposal-kit
description: Draft a branded proposal (הצעת מחיר) or agreement (הסכם התקשרות) for Kobi's client work and render it to an A4 PDF. Use when Kobi shares client requirements and asks to build/draft a proposal, quote, or engagement agreement. Two brands — So Media (lead-automation supplier line) and XSHEVA (strategic AI architecture, direct). Replaces the retired React/Firebase app.
---

# Proposal Kit

Turn client requirements into a finished, branded PDF. Never save to any database.

## 1. Intake — confirm before drafting
- **Brand:** `somedia` (Kobi as So Media's supplier — lead automation, iPlan) or `xsheva` (direct — strategic AI architecture).
- **Doc type:** `proposal` (הצעת מחיר) or `agreement` (הסכם התקשרות).
- Client name, industry, the problem, scope of work.
- Pricing intent (setup + monthly, or fixed/hourly). For `xsheva`: self-hosted vs cloud.
- Validity date.

## 2. Assemble
Read, for the chosen brand:
- `brands/<brand>/design-system.md` — tokens, chrome.
- `brands/<brand>/<doctype>.html` — the template to fill.
- `brands/<brand>/rules.md` — payment/SLA/warranty/IP boilerplate. Apply these; do not invent terms.
- `shared/section-structure.md` — section order.
- The closest file in `examples/<brand>/` — phrasing reference (already redacted; never copy a real client name or ₪ figure from it).

## 3. Draft
Write section-by-section in Hebrew, RTL, in the brand voice. Apply the brand's rules for
payment, warranty, IP, exclusions, and (XSHEVA) SLA/ROI/risk. Fill the HTML template into a
working copy `build.html` in the scratchpad.

## 4. Render
`shared/render.sh build.html <client>-<brand>-<doctype>.pdf`
Deliver the PDF. Persist nothing.

## Notes
- So Media line: "מאת SoMedia CRM"; supplier entity סו מדיה בע״מ ח.פ 516759149.
- XSHEVA line: "מוגש ע״י Kobi Hazout · XSHEVA · kobi@xsheva.com"; mark מסמך סודי.
- Interactive alternative for So Media docs: `npm run dev` renders the same design via React forms.
