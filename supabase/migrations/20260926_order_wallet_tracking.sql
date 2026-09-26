-- Migration: Order Wallet Tracking & Apple PassKit Device Registrations
-- Run this in your Supabase SQL Editor if you want persistent device registrations and audit logs

-- 1. Add wallet tracking audit columns to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS wallet_sync_status TEXT DEFAULT 'SKIPPED',
  ADD COLUMN IF NOT EXISTS wallet_last_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wallet_sync_error TEXT;

-- 2. Create PassKit Apple device registration table for APNs push notifications
CREATE TABLE IF NOT EXISTS pass_device_registrations (
  device_library_identifier TEXT NOT NULL,
  push_token TEXT NOT NULL,
  pass_type_identifier TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (device_library_identifier, pass_type_identifier, serial_number)
);

-- Index for speedy lookups when dispatching APNs push notifications by pass
CREATE INDEX IF NOT EXISTS idx_pass_registrations_serial 
  ON pass_device_registrations (pass_type_identifier, serial_number);

-- Index for PassKit device query (passesUpdatedSince)
CREATE INDEX IF NOT EXISTS idx_pass_registrations_device 
  ON pass_device_registrations (device_library_identifier, pass_type_identifier, updated_at);
