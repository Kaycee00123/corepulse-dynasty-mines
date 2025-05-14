
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNFTs } from '@/contexts/NFTContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NFT } from '@/types';
import { NFTDetailView } from '@/components/NFTDetailView';

const NFTs = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { nfts, userNFTs, isLoading: nftsLoading, buyNFT } = useNFTs();
  
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Check if a user owns a specific NFT
  const isOwned = (nftId: string) => {
    return userNFTs.some(userNft => userNft.nft_id === nftId);
  };

  // Handle purchase
  const handleBuy = async () => {
    if (!selectedNFT) return;
    
    try {
      await buyNFT(selectedNFT.id);
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error buying NFT:', error);
    }
  };

  // If not authenticated, redirect to sign in
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  // Loading state
  if (authLoading || nftsLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  // Group NFTs by tier
  const bronzeNFTs = nfts.filter(nft => nft.tier === 'bronze');
  const silverNFTs = nfts.filter(nft => nft.tier === 'silver');
  const goldNFTs = nfts.filter(nft => nft.tier === 'gold');
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow bg-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">NFT Marketplace</h1>
          </div>
          
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Collection</CardTitle>
              </CardHeader>
              <CardContent>
                {userNFTs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">You don't own any NFTs yet</p>
                    <p className="text-sm">Purchase NFTs to boost your mining capabilities.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userNFTs.map((userNft) => {
                      const nft = nfts.find(n => n.id === userNft.nft_id);
                      if (!nft) return null;
                      
                      return (
                        <div 
                          key={userNft.id}
                          className="relative overflow-hidden rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => {
                            setSelectedNFT(nft);
                            setIsDetailOpen(true);
                          }}
                        >
                          <div className="relative aspect-square">
                            <img 
                              src={nft.image_url} 
                              alt={nft.name} 
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className={`
                                ${nft.tier === 'gold' ? 'bg-amber-500' : 
                                  nft.tier === 'silver' ? 'bg-gray-400' : 
                                  'bg-amber-700'} 
                                text-white uppercase`}
                              >
                                {nft.tier}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3 bg-white border-t">
                            <h3 className="font-medium truncate">{nft.name}</h3>
                            <div className="text-xs text-gray-500">+{nft.boost_percentage}% Boost</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All NFTs</TabsTrigger>
              <TabsTrigger value="bronze">Bronze</TabsTrigger>
              <TabsTrigger value="silver">Silver</TabsTrigger>
              <TabsTrigger value="gold">Gold</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {nfts.map(nft => (
                  <Card 
                    key={nft.id}
                    className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                      isOwned(nft.id) ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedNFT(nft);
                      setIsDetailOpen(true);
                    }}
                  >
                    <div className="relative aspect-square">
                      <img 
                        src={nft.image_url} 
                        alt={nft.name} 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={`
                          ${nft.tier === 'gold' ? 'bg-amber-500' : 
                            nft.tier === 'silver' ? 'bg-gray-400' : 
                            'bg-amber-700'} 
                          text-white uppercase`}
                        >
                          {nft.tier}
                        </Badge>
                      </div>
                      {isOwned(nft.id) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-center text-xs py-1">
                          OWNED
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{nft.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-bold">{nft.price} $WAVES</span>
                        <span className="text-xs text-gray-500">+{nft.boost_percentage}% Boost</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="bronze">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {bronzeNFTs.map(nft => (
                  <Card 
                    key={nft.id}
                    className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                      isOwned(nft.id) ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedNFT(nft);
                      setIsDetailOpen(true);
                    }}
                  >
                    <div className="relative aspect-square">
                      <img 
                        src={nft.image_url} 
                        alt={nft.name} 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-700 text-white uppercase">Bronze</Badge>
                      </div>
                      {isOwned(nft.id) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-center text-xs py-1">
                          OWNED
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{nft.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-bold">{nft.price} $WAVES</span>
                        <span className="text-xs text-gray-500">+{nft.boost_percentage}% Boost</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="silver">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {silverNFTs.map(nft => (
                  <Card 
                    key={nft.id}
                    className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                      isOwned(nft.id) ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedNFT(nft);
                      setIsDetailOpen(true);
                    }}
                  >
                    <div className="relative aspect-square">
                      <img 
                        src={nft.image_url} 
                        alt={nft.name} 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gray-400 text-white uppercase">Silver</Badge>
                      </div>
                      {isOwned(nft.id) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-center text-xs py-1">
                          OWNED
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{nft.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-bold">{nft.price} $WAVES</span>
                        <span className="text-xs text-gray-500">+{nft.boost_percentage}% Boost</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="gold">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {goldNFTs.map(nft => (
                  <Card 
                    key={nft.id}
                    className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                      isOwned(nft.id) ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedNFT(nft);
                      setIsDetailOpen(true);
                    }}
                  >
                    <div className="relative aspect-square">
                      <img 
                        src={nft.image_url} 
                        alt={nft.name} 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500 text-white uppercase">Gold</Badge>
                      </div>
                      {isOwned(nft.id) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-center text-xs py-1">
                          OWNED
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{nft.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-bold">{nft.price} $WAVES</span>
                        <span className="text-xs text-gray-500">+{nft.boost_percentage}% Boost</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* NFT Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>NFT Details</DialogTitle>
          </DialogHeader>
          {selectedNFT && (
            <NFTDetailView 
              nft={selectedNFT} 
              onBuy={handleBuy} 
              alreadyOwned={isOwned(selectedNFT.id)} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default NFTs;
