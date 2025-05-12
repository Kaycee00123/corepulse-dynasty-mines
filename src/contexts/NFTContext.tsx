import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useMining } from './MiningContext';
import { toast } from '@/hooks/use-toast';
import { NFT, UserNFT } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface NFTContextType {
  availableNFTs: NFT[];
  userNFTs: UserNFT[];
  isLoading: boolean;
  mintNFT: (nftId: string) => Promise<boolean>;
  totalBoost: number;
}

const NFTContext = createContext<NFTContextType | undefined>(undefined);

export const NFTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { balance, updateMiningBoost } = useMining();
  const [availableNFTs, setAvailableNFTs] = useState<NFT[]>([]);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalBoost, setTotalBoost] = useState<number>(0);

  // Load NFTs data
  useEffect(() => {
    fetchAvailableNFTs();
    
    if (user) {
      fetchUserNFTs();
    } else {
      setUserNFTs([]);
      setTotalBoost(0);
      setIsLoading(false);
    }
  }, [user]);

  // Subscribe to user NFTs updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_nfts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUserNFTs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAvailableNFTs = async () => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .order('price', { ascending: true });

      if (error) {
        throw error;
      }

      // Cast the tier field to ensure it matches our type
      const typedNFTs: NFT[] = data?.map(nft => ({
        ...nft,
        tier: nft.tier as "bronze" | "silver" | "gold" // Cast string to our union type
      })) || [];

      setAvailableNFTs(typedNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast({
        title: "Error",
        description: "Failed to load available NFTs.",
        variant: "destructive"
      });
    } finally {
      if (!user) {
        setIsLoading(false);
      }
    }
  };

  const fetchUserNFTs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_nfts')
        .select('*, nft:nfts(*)')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Properly cast the data to match our types
      const formattedUserNFTs: UserNFT[] = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        nft_id: item.nft_id,
        purchased_at: item.purchased_at,
        nft: item.nft ? {
          ...item.nft,
          tier: item.nft.tier as "bronze" | "silver" | "gold" // Cast to match our type
        } : undefined
      }));

      setUserNFTs(formattedUserNFTs);

      // Calculate total boost from owned NFTs
      const calculatedBoost = formattedUserNFTs.reduce((total, userNft) => {
        return total + (userNft.nft?.boost_percentage || 0);
      }, 0);
      
      setTotalBoost(calculatedBoost);
      updateMiningBoost(calculatedBoost);
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      toast({
        title: "Error",
        description: "Failed to load your NFTs.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mintNFT = async (nftId: string): Promise<boolean> => {
    if (!user || !balance) {
      toast({
        title: "Error",
        description: "You need to be logged in to mint NFTs",
        variant: "destructive"
      });
      return false;
    }
    
    const nftToMint = availableNFTs.find(nft => nft.id === nftId);
    
    if (!nftToMint) {
      toast({
        title: "Error",
        description: "NFT not found",
        variant: "destructive"
      });
      return false;
    }
    
    if (balance.tokens < nftToMint.price) {
      toast({
        title: "Insufficient balance",
        description: `You need ${nftToMint.price} tokens to mint this NFT`,
        variant: "destructive"
      });
      return false;
    }
    
    // Check if user already has this NFT
    const alreadyOwns = userNFTs.some(userNft => userNft.nft_id === nftId);
    if (alreadyOwns) {
      toast({
        title: "Already owned",
        description: "You already own this NFT",
        variant: "destructive"
      });
      return false;
    }
    
    // Start database transaction
    try {
      // 1. Insert the user_nft record
      const { error: nftError } = await supabase
        .from('user_nfts')
        .insert({
          user_id: user.id,
          nft_id: nftId
        });

      if (nftError) {
        throw nftError;
      }

      // 2. Deduct the cost from user balance
      const { error: balanceError } = await supabase
        .from('user_balances')
        .update({
          tokens: balance.tokens - nftToMint.price,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (balanceError) {
        throw balanceError;
      }

      // 3. Update user's mining boost in profile
      const newBoost = totalBoost + nftToMint.boost_percentage;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          mining_boost: newBoost
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Transaction succeeded, update local state
      setTotalBoost(newBoost);
      updateMiningBoost(newBoost);
      
      toast({
        title: "NFT Minted!",
        description: `Successfully minted ${nftToMint.name}. Your mining boost is now +${newBoost}%!`,
      });
      
      return true;
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast({
        title: "Minting failed",
        description: "There was an error minting your NFT. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <NFTContext.Provider value={{
      availableNFTs,
      userNFTs,
      isLoading,
      mintNFT,
      totalBoost
    }}>
      {children}
    </NFTContext.Provider>
  );
};

export const useNFT = () => {
  const context = useContext(NFTContext);
  if (context === undefined) {
    throw new Error('useNFT must be used within an NFTProvider');
  }
  return context;
};
