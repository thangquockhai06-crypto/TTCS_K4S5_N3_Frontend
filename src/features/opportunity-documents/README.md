# Opportunity Documents

## Scope

This module is the frontend foundation for attaching documents to existing CRM
opportunities. It defines document metadata, browser-file upload request types,
and pure client-side file validation. It does not provide an upload UI, API
service, persistent storage, or working upload/download behavior.

## Structure

- `types/OpportunityDocument.types.ts` separates persisted document metadata
  from upload requests containing browser `File` objects. It also defines
  access hints and a loading/success/error state shape for future UI work.
- `utils/documentValidation.ts` provides pure validation helpers that can be
  called independently of React.

## Validation

Each selected file must be non-empty and no larger than 20 MB
(`20 * 1024 * 1024` bytes). Multiple files can be supplied in one request and
validated independently. No file-extension or MIME-type whitelist is applied;
allowed formats require a separate business decision.

Client-side validation is only a usability check. The API must independently
validate file contents, size, metadata, and authorization before accepting or
serving documents.

## Planned UI integration

Integrate the future document UI with the existing opportunity list in the
Customer 360 **Cơ hội & Hợp đồng** tab, scoped to the selected opportunity.
Reuse shared UI components and theme tokens where appropriate. This foundation
does not add a standalone page, route, or Sidebar item.

## API and authorization limitations

No opportunity-document API contract or backend integration is included.
Uploads, downloads, and persistence are not implemented. The `access` metadata
represents frontend display hints only; it is not a security boundary.
Authorization, opportunity scoping, and file access must be enforced by the
backend when an API contract is available.
