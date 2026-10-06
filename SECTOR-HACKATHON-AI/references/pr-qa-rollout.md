# PR-QA — snapshot date rollout

Frontend fixes keep the existing layout. A snapshot without `data_date` remains readable,
but its trading date is shown as unavailable instead of inferred from `updated_at`.

For source trading dates and the corrected proxy baseline to reach live data:

1. Apply `supabase/migrations/20261007030000_snapshot_data_date.sql` to the target database.
2. Deploy `siba-snapshot-proxy` and `siba-workflow` from this branch after the migration.
3. Check a newly generated snapshot: `data_date` must match the source daily record,
   while `updated_at` records ingestion time. Do not backfill old dates from `updated_at`.

The branch does not deploy functions or apply migrations automatically. Existing
snapshot rows and live case history are preserved. The proxy volume baseline now
requires 20 distinct preceding sessions and excludes the current session.

Before merging, manually check search with missing metadata, preset additions,
an insufficient-volume-history modal, refresh, logout, and two-account switching.
