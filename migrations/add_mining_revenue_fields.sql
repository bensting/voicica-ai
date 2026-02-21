-- Add mining revenue tracking fields to credit_history
-- These fields record the raw ad revenue data and random multiplier used for dynamic $VOICICA calculation

ALTER TABLE credit_history ADD COLUMN ad_revenue_micros BIGINT;
ALTER TABLE credit_history ADD COLUMN ad_revenue_currency VARCHAR(3);
ALTER TABLE credit_history ADD COLUMN ad_revenue_source VARCHAR(10);
ALTER TABLE credit_history ADD COLUMN random_multiplier REAL;
