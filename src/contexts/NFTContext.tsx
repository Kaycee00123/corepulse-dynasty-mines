
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useMining } from './MiningContext';
import { toast } from '@/hooks/use-toast';
import { NFT, UserNFT } from '@/types';

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

  // Mock NFTs data
  useEffect(() => {
    const mockNFTs: NFT[] = [
      {
        id: 'bronze_miner',
        name: 'Bronze Miner',
        description: 'A basic mining pass that boosts your mining rate by 10%',
        tier: 'bronze',
        boost_percentage: 10,
        price: 1000,
        image_url: '/placeholder.svg'
      },
      {
        id: 'silver_excavator',
        name: 'Silver Excavator',
        description: 'An intermediate mining pass that boosts your mining rate by 20%',
        tier: 'silver',
        boost_percentage: 20,
        price: 2500,
        image_url: '/placeholder.svg'
      },
      {
        id: 'gold_dynamite',
        name: 'Gold Dynamite',
        description: 'An advanced mining pass that boosts your mining rate by 35%',
        tier: 'gold',
        boost_percentage: 35,
        price: 5000,
        image_url: '/placeholder.svg'
      }
    ];
    
    setAvailableNFTs(mockNFTs);
    
    if (user) {
      // This would be replaced with actual Supabase query for user's NFTs
      const mockUserNFTs: UserNFT[] = [];
      setUserNFTs(mockUserNFTs);
      
      // Calculate total boost from owned NFTs
      const calculatedBoost = mockUserNFTs.reduce((total, userNft) => {
        const nft = mockNFTs.find(n => n.id === userNft.nft_id);
        return total + (nft?.boost_percentage || 0);
      }, 0);
      
      setTotalBoost(calculatedBoost);
      updateMiningBoost(calculatedBoost);
    }
    
    setIsLoading(false);
  }, [user]);

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
    
    try {
      // This would be replaced with actual Supabase transaction
      // Mock the minting process
      const newUserNFT: UserNFT = {
        id: `user_nft_${Date.now()}`,
        user_id: user.id,
        nft_id: nftId,
        purchased_at: new Date().toISOString(),
        nft: nftToMint
      };
      
      // Add to user's NFTs
      setUserNFTs(prev => [...prev, newUserNFT]);
      
      // Update total boost
      const newBoost = totalBoost + nftToMint.boost_percentage;
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
