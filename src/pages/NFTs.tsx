
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMining } from '@/contexts/MiningContext';
import { useNFT } from '@/contexts/NFTContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from "@/hooks/use-toast";
import { NFT as NFTType } from '@/types';

const NFTs = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { balance } = useMining();
  const { availableNFTs, userNFTs, mintNFT, isLoading: nftLoading } = useNFT();
  
  const [selectedNFT, setSelectedNFT] = useState<NFTType | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleMint = async () => {
    if (!selectedNFT) return;
    
    setIsMinting(true);
    try {
      const success = await mintNFT(selectedNFT.id);
      if (success) {
        setIsDialogOpen(false);
      }
    } finally {
      setIsMinting(false);
    }
  };

  // If not authenticated, redirect to sign in
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  // Loading state
  if (authLoading || nftLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const getNFTBorderClass = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'border-amber-600';
      case 'silver': return 'border-gray-400';
      case 'gold': return 'border-yellow-400';
      default: return 'border-gray-200';
    }
  };
  
  const getNFTBadgeClass = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-600';
      case 'silver': return 'bg-gray-400';
      case 'gold': return 'bg-yellow-400';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="heading-xl mb-2">Mining NFTs</h1>
            <p className="text-body">
              Mint NFT mining passes to boost your mining rate and earn more tokens.
            </p>
          </div>

          {/* Current Balance */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Available Balance</h3>
                  <p className="text-sm text-gray-500">Use your tokens to mint NFTs</p>
                </div>
                <div className="text-2xl font-bold text-core">
                  {balance?.tokens?.toFixed(2) || "0.00"} tokens
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available NFTs */}
          <h2 className="heading-lg mb-4">Available NFTs</h2>
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
            {availableNFTs.map((nft) => {
              const isOwned = userNFTs.some(userNft => userNft.nft_id === nft.id);
              const canAfford = (balance?.tokens || 0) >= nft.price;
              
              return (
                <Card 
                  key={nft.id} 
                  className={`transition-all hover:shadow-lg ${isOwned ? 'bg-gray-50' : ''} border-2 ${getNFTBorderClass(nft.tier)}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{nft.name}</CardTitle>
                      <Badge className={getNFTBadgeClass(nft.tier)}>
                        {nft.tier.charAt(0).toUpperCase() + nft.tier.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>{nft.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-w-3 aspect-h-2 mb-4">
                      <img 
                        src={nft.image_url} 
                        alt={nft.name} 
                        className="object-cover rounded-lg h-48 w-full"
                      />
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Boost</span>
                      <span className="font-semibold text-green-600">+{nft.boost_percentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price</span>
                      <span className="font-semibold">{nft.price} tokens</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {isOwned ? (
                      <Button variant="outline" className="w-full" disabled>
                        Already Owned
                      </Button>
                    ) : (
                      <Dialog open={isDialogOpen && selectedNFT?.id === nft.id} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setSelectedNFT(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            className={`w-full ${!canAfford ? 'bg-gray-400' : 'bg-core hover:bg-core-dark'}`} 
                            disabled={!canAfford}
                            onClick={() => setSelectedNFT(nft)}
                          >
                            {canAfford ? 'Mint NFT' : 'Insufficient Balance'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm NFT Purchase</DialogTitle>
                            <DialogDescription>
                              You are about to mint the {nft.name} NFT for {nft.price} tokens.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <div className="flex items-center justify-center mb-4">
                              <img 
                                src={nft.image_url} 
                                alt={nft.name} 
                                className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">NFT Tier</span>
                                <span className="font-medium">{nft.tier.charAt(0).toUpperCase() + nft.tier.slice(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Mining Boost</span>
                                <span className="font-medium text-green-600">+{nft.boost_percentage}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Cost</span>
                                <span className="font-medium">{nft.price} tokens</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Your Balance After</span>
                                <span className="font-medium">{((balance?.tokens || 0) - nft.price).toFixed(2)} tokens</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleMint}
                              disabled={isMinting}
                              className="bg-core hover:bg-core-dark"
                            >
                              {isMinting ? 'Minting...' : 'Confirm Purchase'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Your NFTs */}
          <h2 className="heading-lg mb-4">Your NFT Collection</h2>
          {userNFTs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">No NFTs Yet</h3>
                <p className="text-gray-500 mt-1">
                  You don't have any NFTs in your collection yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userNFTs.map((userNft) => {
                const nft = availableNFTs.find(n => n.id === userNft.nft_id);
                if (!nft) return null;
                
                return (
                  <Card key={userNft.id} className={`border-2 ${getNFTBorderClass(nft.tier)}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{nft.name}</CardTitle>
                        <Badge className={getNFTBadgeClass(nft.tier)}>
                          {nft.tier.charAt(0).toUpperCase() + nft.tier.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{nft.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-w-3 aspect-h-2 mb-4">
                        <img 
                          src={nft.image_url} 
                          alt={nft.name} 
                          className="object-cover rounded-lg h-48 w-full"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Mining Boost</span>
                        <span className="font-semibold text-green-600">+{nft.boost_percentage}%</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="w-full text-center text-sm text-gray-500">
                        Minted on {new Date(userNft.purchased_at).toLocaleDateString()}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NFTs;
