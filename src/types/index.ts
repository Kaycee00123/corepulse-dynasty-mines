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
  role?: string; // Add role property that was missing
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
