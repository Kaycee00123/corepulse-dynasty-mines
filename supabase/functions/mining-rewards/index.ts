
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the auth header
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'GET') {
      // Calculate mining stats for user
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('mining_rate, mining_boost, streak_days')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user profile' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Calculate effective mining rate with boosts
      const baseRate = profile.mining_rate || 1.0;
      const boostPercentage = profile.mining_boost || 0;
      const streakBonus = Math.min(profile.streak_days * 0.01, 0.1); // Max 10% from streak
      const effectiveRate = baseRate * (1 + (boostPercentage / 100) + streakBonus);

      // Get total mined by the user
      const { data: miningStats, error: miningError } = await supabaseClient
        .from('mining_sessions')
        .select('tokens_mined')
        .eq('user_id', user.id);

      if (miningError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch mining sessions' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const totalMined = miningStats.reduce((sum, session) => sum + (session.tokens_mined || 0), 0);

      // Get user's balance
      const { data: balance, error: balanceError } = await supabaseClient
        .from('user_balances')
        .select('tokens')
        .eq('user_id', user.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user balance' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Calculate projected earnings
      const projectedEarnings = {
        hourly: effectiveRate * 60,
        daily: effectiveRate * 60 * 24,
        weekly: effectiveRate * 60 * 24 * 7,
        monthly: effectiveRate * 60 * 24 * 30,
      };

      return new Response(
        JSON.stringify({
          mining_rate: baseRate,
          boost_percentage: boostPercentage,
          streak_days: profile.streak_days,
          streak_bonus: streakBonus * 100, // Convert to percentage
          effective_rate: effectiveRate,
          total_mined: totalMined,
          current_balance: balance?.tokens || 0,
          projected_earnings: projectedEarnings,
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else if (req.method === 'POST') {
      // Process mining rewards and handle various operations
      const { action, sessionId, amount } = await req.json();

      switch (action) {
        case 'update_streak':
          // Update user's mining streak
          const { error: streakError } = await supabaseClient
            .from('profiles')
            .update({
              streak_days: amount,
              last_active: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (streakError) {
            return new Response(
              JSON.stringify({ error: 'Failed to update streak' }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Streak updated successfully' }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );

        case 'finalize_session':
          if (!sessionId) {
            return new Response(
              JSON.stringify({ error: 'Session ID is required' }),
              { 
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Get the session
          const { data: session, error: sessionError } = await supabaseClient
            .from('mining_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single();

          if (sessionError) {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch mining session' }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Update the session
          const { error: updateError } = await supabaseClient
            .from('mining_sessions')
            .update({
              tokens_mined: session.tokens_mined + (amount || 0),
              active: false,
              end_time: new Date().toISOString(),
            })
            .eq('id', sessionId);

          if (updateError) {
            return new Response(
              JSON.stringify({ error: 'Failed to update mining session' }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Update user balance
          const { data: userBalance, error: balanceError } = await supabaseClient
            .from('user_balances')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (balanceError && balanceError.code !== 'PGRST116') {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch user balance' }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          if (userBalance) {
            // Update existing balance
            const { error: updateBalanceError } = await supabaseClient
              .from('user_balances')
              .update({
                tokens: userBalance.tokens + (amount || 0),
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', user.id);

            if (updateBalanceError) {
              return new Response(
                JSON.stringify({ error: 'Failed to update user balance' }),
                { 
                  status: 500,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }
          } else {
            // Create new balance record
            const { error: insertBalanceError } = await supabaseClient
              .from('user_balances')
              .insert({
                user_id: user.id,
                tokens: amount || 0,
              });

            if (insertBalanceError) {
              return new Response(
                JSON.stringify({ error: 'Failed to create user balance' }),
                { 
                  status: 500,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Mining session finalized' }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
