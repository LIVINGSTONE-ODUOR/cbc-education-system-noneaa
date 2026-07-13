-- Adds a single optional free-text field to `schools` for fee payment
-- guidance: how to pay, which accounts/paybill/till to pay into, and any
-- other notes the school admin wants parents to see. Deliberately one
-- flexible text field rather than separate structured columns (bank name,
-- account number, paybill, etc.) since schools vary widely in how they
-- accept payment and the admin may want to combine several methods in
-- free-form text (e.g. "M-Pesa Paybill 123456, Acc: admission number.
-- Bank: KCB, Acc 0123456789. Contact the Bursar for installment plans.").

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS fee_payment_instructions TEXT;

COMMENT ON COLUMN schools.fee_payment_instructions IS
  'Optional free-text payment instructions (accounts to pay, paybill/till numbers, other notes) shown alongside the fee structure to parents.';
