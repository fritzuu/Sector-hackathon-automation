# Handoff

- Tahap: S2 (Core lokal deterministik & suite tes) selesai di branch `testing-f`.
- Scope: PRD v0.3, Track 02, tanpa LLM.
- Hasil: 3 deterministic rules (abnormal volume >= 2.0x median, relative movement >= 2.0%, new filing), state machine lifecycle (OPEN -> UPDATED / MONITORING -> CLOSED setelah 2 sesi berturut-turut tanpa anomali, DATA_INCOMPLETE), dan versioned template renderer v1.0.0.
- Verifikasi: `npm test` lulus 20/20 unit tests (Vitest); `npm run build` berhasil bersih (`tsc`).
- File utama:
  - `src/engine/rules/` (`abnormalVolume.ts`, `relativeMovement.ts`, `newFiling.ts`, `index.ts`)
  - `src/engine/caseEngine.ts`
  - `src/engine/templateRenderer.ts`
  - `src/types/` (`sectors.ts`, `engine.ts`)
  - `tests/` (`rules.test.ts`, `caseLifecycle.test.ts`, `templateRenderer.test.ts`)
- Selanjutnya: Slice S3/S4 (Persistensi Supabase / Scheduler & Automation Edge Function) atau adapter live Sectors API.
