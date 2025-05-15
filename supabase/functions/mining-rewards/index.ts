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

    // Parse request body for POST requests
    let requestBody;
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
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
      const { action } = requestBody;

      if (!action) {
        return new Response(
          JSON.stringify({ error: 'Action is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      switch (action) {
        case 'claim_streak':
          // Get current UTC+1 time
          const now = new Date();
          const utcPlusOne = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000));

          // Get user's profile
          const { data: currentProfile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('streak_days, last_claimed')
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

          const lastClaimed = currentProfile.last_claimed ? new Date(currentProfile.last_claimed) : null;
          let newStreakDays = currentProfile.streak_days || 0;

          // Check if user has already claimed today (UTC+1)
          if (lastClaimed) {
            const lastClaimedUtcPlusOne = new Date(lastClaimed.getTime() + (lastClaimed.getTimezoneOffset() * 60000) + (3600000));
            if (
              lastClaimedUtcPlusOne.getUTCDate() === utcPlusOne.getUTCDate() &&
              lastClaimedUtcPlusOne.getUTCMonth() === utcPlusOne.getUTCMonth() &&
              lastClaimedUtcPlusOne.getUTCFullYear() === utcPlusOne.getUTCFullYear()
            ) {
              return new Response(
                JSON.stringify({ error: 'Already claimed today' }),
                { 
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }

            // Check if streak should be reset (missed a day)
            const yesterday = new Date(utcPlusOne);
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            
            if (
              lastClaimedUtcPlusOne.getUTCDate() !== yesterday.getUTCDate() ||
              lastClaimedUtcPlusOne.getUTCMonth() !== yesterday.getUTCMonth() ||
              lastClaimedUtcPlusOne.getUTCFullYear() !== yesterday.getUTCFullYear()
            ) {
              newStreakDays = 1; // Reset streak
            } else {
              newStreakDays += 1; // Increment streak
            }
          } else {
            newStreakDays = 1; // First claim
          }

          try {
            // Start transaction
            const { error: transactionError } = await supabaseClient.rpc('begin_transaction');
            if (transactionError) throw transactionError;

            // Record the streak claim
            const { error: claimError } = await supabaseClient
              .from('streak_claims')
              .insert({
                user_id: user.id,
                claimed_at: utcPlusOne.toISOString(),
                streak_days: newStreakDays,
                waves_awarded: 10
              });

            if (claimError) throw claimError;

            // Update user's profile with new streak days and last claimed
            const { error: updateProfileError } = await supabaseClient
              .from('profiles')
              .update({
                streak_days: newStreakDays,
                last_claimed: utcPlusOne.toISOString()
              })
              .eq('id', user.id);

            if (updateProfileError) throw updateProfileError;

            // Award 10 waves points
            const { error: balanceError } = await supabaseClient
              .from('user_balances')
              .update({
                tokens: supabaseClient.rpc('increment', { 
                  x: 10,
                  row_id: user.id 
                })
              })
              .eq('user_id', user.id);

            if (balanceError) throw balanceError;

            // Commit transaction
            const { error: commitError } = await supabaseClient.rpc('commit_transaction');
            if (commitError) throw commitError;

            return new Response(
              JSON.stringify({ 
                success: true, 
                message: 'Streak claimed successfully',
                streak_days: newStreakDays,
                waves_awarded: 10
              }),
              { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          } catch (error) {
            // Rollback transaction on any error
            await supabaseClient.rpc('rollback_transaction').catch(console.error);
            
            console.error('Error in claim_streak:', error);
            return new Response(
              JSON.stringify({ 
                error: error instanceof Error ? error.message : 'Failed to claim streak bonus'
              }),
              { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

        case 'finalize_session':
          if (!requestBody.sessionId) {
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
            .eq('id', requestBody.sessionId)
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
              tokens_mined: session.tokens_mined + (requestBody.amount || 0),
              active: false,
              end_time: new Date().toISOString(),
            })
            .eq('id', requestBody.sessionId);

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
                tokens: userBalance.tokens + (requestBody.amount || 0),
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
                tokens: requestBody.amount || 0,
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
          break;

        default:
          return new Response(
            JSON.stringify({ error: `Invalid action: ${action}` }),
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
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
