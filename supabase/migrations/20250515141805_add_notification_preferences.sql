-- Add notification_preferences column to profiles table
ALTER TABLE profiles
ADD COLUMN notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "epoch_events": true,
    "mining_updates": true,
    "referral_updates": true
}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences stored as JSONB';
