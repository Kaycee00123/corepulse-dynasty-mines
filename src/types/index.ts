import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  avatar_url: string | null;
  mining_rate: number;
  mining_boost: number;
  last_active: string | null;
  streak_days: number;
  referral_code: string;
  role?: string;
  tokens?: number;
  notification_preferences?: {
    email: boolean;
    push: boolean;
    epoch_events: boolean;
    mining_updates: boolean;
    referral_updates: boolean;
  };
}

export interface AppUser extends User {
  // Additional app-specific user properties can go here
}

export interface MiningSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  active: boolean;
  tokens_mined: number;
}

export interface UserBalance {
  id: string;
  user_id: string;
  tokens: number;
  updated_at: string;
}

export interface NFT {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  boost_percentage: number;
  price: number;
  image_url: string;
}

export interface UserNFT {
  id: string;
  user_id: string;
  nft_id: string;
  purchased_at: string;
  nft?: NFT;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  created_at: string;
  bonus_earned: number;
}

export interface Crew {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  created_at: string;
  owner_id: string;
  member_count: number;
  total_mining_power?: number;
  owner?: {
    username: string;
    avatar_url?: string;
  };
}

export interface CrewMember {
  id: string;
  crew_id: string;
  user_id: string;
  joined_at: string;
  role: 'owner' | 'admin' | 'member';
  user?: {
    username: string;
    avatar_url?: string;
    mining_rate: number;
  };
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  tokens_mined: number;
  rank: number;
}

export interface NotificationType {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'mining' | 'nft' | 'referral' | 'crew' | 'system';
  read: boolean;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  tokens_mined: number;
  nfts_minted: number;
  current_epoch_start: string;
  current_epoch_end: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: {
    users?: string[];
    nfts?: string[];
    crews?: string[];
    settings?: string[];
    analytics?: string[];
    logs?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
}

export interface AdminLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

export interface EnhancedAdminStats extends AdminStats {
  mining_rewards: {
    total_distributed: number;
    average_per_user: number;
    top_earners: Array<{
      user_id: string;
      username: string;
      total_earned: number;
    }>;
  };
  user_engagement: {
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    average_session_duration: number;
    retention_rate: number;
  };
  referral_stats: {
    total_referrals: number;
    active_referrals: number;
    total_rewards_distributed: number;
    top_referrers: Array<{
      user_id: string;
      username: string;
      referral_count: number;
    }>;
  };
  crew_stats: {
    total_crews: number;
    active_crews: number;
    average_crew_size: number;
    top_performing_crews: Array<{
      crew_id: string;
      name: string;
      total_tokens_mined: number;
      member_count: number;
    }>;
  };
  token_metrics: {
    total_supply: number;
    circulating_supply: number;
    distribution_by_type: {
      mining_rewards: number;
      referral_rewards: number;
      crew_rewards: number;
      other: number;
    };
  };
}
