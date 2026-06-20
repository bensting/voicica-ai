-- Add dev_value column to system_configs for separate dev/prod feature flag control
ALTER TABLE system_configs ADD COLUMN dev_value TEXT;
