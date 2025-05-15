export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Functions: {
      validate_referral_code: {
        Args: {
          p_referral_code: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_referral_analytics: {
        Args: {
          p_referral_id: string
          p_status: string
          p_mining_amount?: number
        }
        Returns: void
      }
    }
  }
} 