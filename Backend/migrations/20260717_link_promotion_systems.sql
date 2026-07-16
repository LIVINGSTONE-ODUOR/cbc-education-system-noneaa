-- =============================================================================
-- Link the two promotion systems
-- =============================================================================
-- The codebase has two independent promotion mechanisms:
--   1. promotion_decisions (grading module) — one row per learner, written by
--      grading.controller.js#savePromotionDecision. Feeds report cards.
--   2. promotion_batches / promotion_batch_learners — a batch decision cycle
--      (draft -> ready -> running -> completed -> locked), written by
--      promotion.controller.js. Feeds the Promotions & Graduations UI.
--
-- They didn't reference each other: locking a batch never created a
-- promotion_decisions row, so report cards / getPromotionDecisions() had no
-- visibility into batch-driven promotions or graduations.
--
-- This migration adds a nullable batch_id FK so batch-driven decisions can
-- be recorded in promotion_decisions too (see promotion.controller.js
-- setLockState, updated to insert here on lock). batch_id is NULL for
-- decisions entered directly through the grading module.
-- =============================================================================

ALTER TABLE promotion_decisions
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES promotion_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_promotion_decisions_batch ON promotion_decisions(batch_id);
