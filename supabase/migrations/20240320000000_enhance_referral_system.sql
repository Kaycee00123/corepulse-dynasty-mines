-- Create referral_tiers table
CREATE TABLE referral_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    min_referrals INTEGER NOT NULL,
    bonus_multiplier DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_analytics table
CREATE TABLE referral_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID REFERENCES referrals(id),
    status TEXT NOT NULL, -- 'active', 'inactive', 'converted'
    last_activity TIMESTAMP WITH TIME ZONE,
    mining_contribution DECIMAL DEFAULT 0,
    conversion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default referral tiers
INSERT INTO referral_tiers (name, min_referrals, bonus_multiplier) VALUES
    ('Bronze', 0, 1.0),
    ('Silver', 5, 1.2),
    ('Gold', 10, 1.5),
    ('Platinum', 25, 2.0),
    ('Diamond', 50, 2.5);

-- Create function to validate referral code
CREATE OR REPLACE FUNCTION validate_referral_code(
    p_referral_code TEXT,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_referrer_id UUID;
BEGIN
    -- Check if referral code exists
    SELECT id INTO v_referrer_id
    FROM profiles
    WHERE referral_code = p_referral_code;

    -- Return false if code doesn't exist
    IF v_referrer_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Prevent self-referral
    IF v_referrer_id = p_user_id THEN
        RETURN FALSE;
    END IF;

    -- Check for existing referral
    IF EXISTS (
        SELECT 1 FROM referrals
        WHERE referred_id = p_user_id
    ) THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate referral rewards
CREATE OR REPLACE FUNCTION calculate_referral_reward(
    p_referral_id UUID,
    p_mining_amount DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_referrer_id UUID;
    v_tier_multiplier DECIMAL;
    v_base_reward DECIMAL;
BEGIN
    -- Get referrer ID
    SELECT referrer_id INTO v_referrer_id
    FROM referrals
    WHERE id = p_referral_id;

    -- Get referrer's tier multiplier
    SELECT rt.bonus_multiplier INTO v_tier_multiplier
    FROM referral_tiers rt
    JOIN (
        SELECT tier_id
        FROM profiles
        WHERE id = v_referrer_id
    ) p ON rt.id = p.tier_id;

    -- Calculate base reward (5% of mining amount)
    v_base_reward := p_mining_amount * 0.05;

    -- Apply tier multiplier
    RETURN v_base_reward * v_tier_multiplier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update referral analytics
CREATE OR REPLACE FUNCTION update_referral_analytics(
    p_referral_id UUID,
    p_status TEXT,
    p_mining_amount DECIMAL DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO referral_analytics (
        referral_id,
        status,
        last_activity,
        mining_contribution,
        conversion_date
    )
    VALUES (
        p_referral_id,
        p_status,
        NOW(),
        p_mining_amount,
        CASE WHEN p_status = 'converted' THEN NOW() ELSE NULL END
    )
    ON CONFLICT (referral_id) DO UPDATE
    SET
        status = EXCLUDED.status,
        last_activity = EXCLUDED.last_activity,
        mining_contribution = referral_analytics.mining_contribution + EXCLUDED.mining_contribution,
        conversion_date = EXCLUDED.conversion_date,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update referral analytics on mining session completion
CREATE OR REPLACE FUNCTION update_referral_analytics_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_referral_id UUID;
BEGIN
    -- Get referral ID for the user
    SELECT id INTO v_referral_id
    FROM referrals
    WHERE referred_id = NEW.user_id;

    IF v_referral_id IS NOT NULL THEN
        -- Update analytics with mining contribution
        PERFORM update_referral_analytics(
            v_referral_id,
            'active',
            NEW.tokens_mined
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER mining_session_complete
    AFTER UPDATE OF end_time ON mining_sessions
    FOR EACH ROW
    WHEN (NEW.end_time IS NOT NULL AND OLD.end_time IS NULL)
    EXECUTE FUNCTION update_referral_analytics_trigger();

-- Add RLS policies
ALTER TABLE referral_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to referral tiers"
    ON referral_tiers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow read access to own referral analytics"
    ON referral_analytics FOR SELECT
    TO authenticated
    USING (
        referral_id IN (
            SELECT id FROM referrals
            WHERE referrer_id = auth.uid()
        )
    );

-- Add RLS policies for referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Allow users to create referrals
CREATE POLICY "Users can create referrals"
    ON referrals FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = referred_id
    );

-- Allow users to view their own referrals (as referrer)
CREATE POLICY "Users can view their referrals"
    ON referrals FOR SELECT
    TO authenticated
    USING (
        auth.uid() = referrer_id
    );

-- Allow users to view referrals where they are the referred user
CREATE POLICY "Users can view referrals where they are referred"
    ON referrals FOR SELECT
    TO authenticated
    USING (
        auth.uid() = referred_id
    );

-- Add unique constraint to prevent duplicate referrals
ALTER TABLE referrals
ADD CONSTRAINT unique_referral
UNIQUE (referrer_id, referred_id); 