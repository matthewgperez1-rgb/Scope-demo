# SCOPE Operations Console redesign — 3 October 2026

Mobile: **v0.3.0**. Desktop: **V2.1.0 OPTIMIZED visual candidate** on
`refactor/v2.0.2-optimization`; no promotion of the frozen operational release.

## Changelog

- Rebuilt Mobile composition: command header, centered real gold emblem,
  capture/batch/handoff navigation, dimensional scan controls, grouped inset
  inputs, draft cards, clearer handoff and accessible press/focus feedback.
- Rendered 180/192/512 PNG Home Screen icons from the existing real artwork.
  Original geometry retained; no generated military emblem used.
- Aligned asset/cache versions and bundled the existing 2.3.8 barcode decoder
  with its license for dependable offline loading.
- Applied shared navy/gold/cyan materials to desktop masthead, navigation,
  compact raised KPI tiles, buttons, inputs, reports and dialogs. Dense tables
  retain row padding. White document/canvas surfaces remain white.
- No receiving, DASF, CMR, DOA, PDF/signature, storage or package business logic
  changed. Mobile app.js changes are version and reduced-motion scroll only.
- Guard tests now accept SCOPE_TEST_FILE, avoiding even temporary replacement
  of the frozen release. Browser evidence is produced by both guards.

## Executed local QA

| Check | Result |
|---|---|
| Source extraction and byte-equivalent rebuild | PASS |
| Static code audit | PASS |
| Optimized candidate build | PASS |
| Desktop runtime regression | PASS, 35/35 |
| Desktop focused QC | PASS, 7/7 |
| Separate SMU regression | PASS, 5/5 |
| Desktop browser major-screen/layout checks | PASS, 15/15 |
| Mobile real-browser receiving regression | PASS, 15/15 |
| Frozen V2.0.2 integrity | PASS |
| Unresolved automated failures | 0 |

Browser: Chromium 153, Playwright 1.62.1. Mobile widths 320, 375 and 390 pixels.
Desktop widths 1280 and 1440 pixels. Mobile synthetic camera and actual photo
Code 128 decoder tested; no physical camera claim. Persistence, duplicate
cancel, edit/delete/clear, package hash and download, offline reload and decoder,
JSON dialog, touch targets and reduced motion tested. Screenshots use empty
operational state or explicitly labelled synthetic QA fixtures.

Frozen V2.0.2 is 5,483,783 bytes; SHA-256:
`d71e872a10690db0ccb92f493104f47c8b1108ddd0004de4ba1d0f17e20382cb`.
Candidate is 4,833,481 bytes, 650,302 bytes (11.86%) smaller than baseline.

## NOT RUN / acceptance still required

- Physical iPhone rear-camera decoding on real shipment labels.
- iOS share sheet and Add to Home Screen / installed PWA icon.
- Government workstation standalone HTML and SharePoint/Teams access.
- CAC PIN signatures and signed PDF return using government Adobe.
- Current unit data import, mobile-to-desktop DASF matching and representative
  receiving workflow on the government workstation.

These are acceptance items, not hidden automated PASS results. Local test data
is disposable and is never written into the delivered desktop application.
