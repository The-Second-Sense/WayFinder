-- Migration: Add transfer_pin column to users table
-- Purpose: Store 4-digit PIN for transfer confirmation

ALTER TABLE users
ADD COLUMN transfer_pin VARCHAR(4);

-- Optional: Add index for faster lookups (not necessary for small deployments)
-- CREATE INDEX idx_transfer_pin ON users(transfer_pin);

