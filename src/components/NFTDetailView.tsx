
import React from 'react';
import { NFT } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ChevronRight, Award, Zap } from 'lucide-react';

interface NFTDetailViewProps {
  nft: NFT;
  onBuy: () => void;
  alreadyOwned: boolean;
}

export const NFTDetailView: React.FC<NFTDetailViewProps> = ({ nft, onBuy, alreadyOwned }) => {
  // Helper function for tier colors
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-amber-500';
      case 'silver': return 'bg-gray-400';
      case 'bronze': return 'bg-amber-700';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* NFT Image */}
      <div>
        <AspectRatio ratio={1 / 1} className="bg-gray-100 rounded-lg overflow-hidden">
          <img 
            src={nft.image_url} 
            alt={nft.name} 
            className="object-cover w-full h-full transition-transform hover:scale-105 duration-300" 
          />
        </AspectRatio>
      </div>
      
      {/* NFT Info */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold">{nft.name}</h2>
          <Badge className={`${getTierColor(nft.tier)} text-white uppercase`}>
            {nft.tier}
          </Badge>
        </div>
        
        <p className="text-gray-600">{nft.description}</p>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="flex items-center p-3">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                <div>
                  <div className="text-sm text-gray-500">Boost</div>
                  <div className="font-semibold">+{nft.boost_percentage}%</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-3">
                <Award className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <div className="text-sm text-gray-500">Rarity</div>
                  <div className="font-semibold capitalize">{nft.tier}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Price and Buy Button */}
        <div className="border-t border-gray-200 pt-4 mt-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-gray-500">Price</div>
              <div className="text-2xl font-bold">{nft.price} $WAVES</div>
            </div>
            {alreadyOwned ? (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Already Owned
              </Badge>
            ) : (
              <Button onClick={onBuy} className="flex items-center gap-2">
                Buy Now <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Buying this NFT will permanently increase your mining boost by {nft.boost_percentage}%.
            NFTs stack with each other for maximum mining efficiency.
          </div>
        </div>
      </div>
    </div>
  );
};
