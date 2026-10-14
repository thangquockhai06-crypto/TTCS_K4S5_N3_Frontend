# Lead assignment response & SLA monitoring

This feature is intentionally isolated under `src/features/lead-assignment-response-sla/` and can be mounted as an authenticated route at `/lead-assignment-response-sla`.

## Purpose

This UI allows sales users to:

- review leads assigned to their queue,
- accept a lead without implying first contact,
- reject an assignment with a required reason,
- monitor SLA status for remaining response time,
- review team-lead monitoring data without claiming backend notifications are enforced.

## Integration notes

- Route wiring lives in `src/routes/AppRoutes.tsx`.
- Sidebar navigation registration is in `src/components/layout/Sidebar.tsx`.
- The feature uses the existing React Router, shared `Button`, and authorization hooks.

## API dependency and mock behavior

The feature uses an in-memory mock service only in development mode. The banner mirrors the requirement:

> DEVELOPMENT MOCK DATA — No real CRM updates or SLA notifications are being executed.

In production builds, the service intentionally throws rather than silently falling back to mock data. This keeps the UI honest and makes API integration explicit.

## Acceptance criteria covered in the UI

- loading states,
- empty states,
- success and error states,
- required rejection reason validation,
- accept/reject actions with in-progress state guards,
- SLA status labels for within, approaching, overdue, satisfied, and unavailable,
- team-lead monitoring panel,
- responsive layout and theme-safe styles.
