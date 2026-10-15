# Lead conversion

This feature is intentionally scoped to `src/features/lead-conversion/` and is mounted from the existing Lead management list rather than as a new sidebar route.

## Purpose

The conversion flow lets a sales user turn a qualified lead into a customer and sales opportunity without re-entering the same company and contact metadata.

## Integration notes

- The action is exposed from the existing Lead card list in `src/features/lead-management/components/LeadList.tsx`.
- The dialog is intentionally isolated so the route, theme, and lead list remain unchanged outside the feature.
- The feature uses the shared `Modal`, `Button`, and app theme tokens already used in the CRM UI.

## API dependency and mock behavior

This repository does not expose a real frontend conversion endpoint. The feature therefore uses a typed mock adapter that validates required fields and returns a realistic conversion result shape.

> DEVELOPMENT MOCK DATA — No real customer, contact, opportunity, or activity records have been created.

This is intentionally limited to UI testing and must be replaced by the real backend contract when available.

## Acceptance criteria covered

- eligible vs ineligible lead states,
- preview form pre-populated from lead data,
- required-field validation,
- in-progress submission lock,
- success result display and route links,
- warning banner for mock-only behavior,
- responsive layout and theme-safe styling.
