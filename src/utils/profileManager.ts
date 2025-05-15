import { supabase } from '@/integrations/supabase/client';

export const ensureUserProfiles = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching current user:', userError);
      return;
    }

    if (!user) {
      console.log('No user logged in');
      return;
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist or there's an error (except for not found)
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            notification_preferences: { email: true, push: true }
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
        console.log('Created profile for user:', user.id);
      } else {
        console.error('Error checking profile:', profileError);
        throw profileError;
      }
    }
  } catch (error) {
    console.error('Error in ensureUserProfiles:', error);
    throw error;
  }
}; 