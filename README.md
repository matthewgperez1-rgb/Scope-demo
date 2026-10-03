# SCOPE Mobile

SCOPE Mobile is a **separate companion product** for field receiving capture. It is not the authoritative SCOPE application.

## MVP

- Camera barcode scanning where the browser supports the Barcode Detection API.
- Manual fallback entry.
- Raw barcode preservation.
- Conservative auto-extraction only for explicitly labeled SDN, TCN, and NIIN values.
- Quantity, condition code, package count, and notes.
- Batch capture with edit/delete and duplicate warnings.
- IndexedDB persistence on the device.
- Offline-capable PWA.
- Portable `.scopepkg` export/share.
- Human-readable package JSON preview.

## Boundary

Operational SCOPE remains the system of record. Mobile records export with `AWAITING_DASF_MATCH`. Desktop SCOPE must validate the package, compare identifiers against the current DASF, show matched/unmatched/conflict results, and require review before creating receiving records.

No CUI, PII, operational unit data, signed forms, or real workspace backups should be committed to this public repository.
