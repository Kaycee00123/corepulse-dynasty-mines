
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { NFT } from '@/types';

export function AdminNFTsManager() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [nftForm, setNftForm] = useState({
    name: '',
    description: '',
    tier: 'bronze',
    boost_percentage: 5,
    price: 100,
    image_url: ''
  });

  useEffect(() => {
    fetchNFTs();
  }, []);

  const fetchNFTs = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .order('tier', { ascending: false });
        
      if (error) throw error;
      
      setNfts(data as NFT[]);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNFT = async () => {
    try {
      // Validate form
      if (!nftForm.name || !nftForm.description || !nftForm.image_url) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('nfts')
        .insert({
          name: nftForm.name,
          description: nftForm.description,
          tier: nftForm.tier,
          boost_percentage: nftForm.boost_percentage,
          price: nftForm.price,
          image_url: nftForm.image_url
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: "NFT Created",
        description: `${nftForm.name} has been created successfully`
      });
      
      // Reset form and update list
      setNfts([...nfts, data as NFT]);
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating NFT:', error);
      toast({
        title: "Failed to create NFT",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditNFT = (nft: NFT) => {
    setSelectedNFT(nft);
    setNftForm({
      name: nft.name,
      description: nft.description,
      tier: nft.tier,
      boost_percentage: nft.boost_percentage,
      price: nft.price,
      image_url: nft.image_url
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateNFT = async () => {
    if (!selectedNFT) return;
    
    try {
      const { error } = await supabase
        .from('nfts')
        .update({
          name: nftForm.name,
          description: nftForm.description,
          tier: nftForm.tier,
          boost_percentage: nftForm.boost_percentage,
          price: nftForm.price,
          image_url: nftForm.image_url
        })
        .eq('id', selectedNFT.id);
        
      if (error) throw error;
      
      toast({
        title: "NFT Updated",
        description: `${nftForm.name} has been updated successfully`
      });
      
      // Update local state
      setNfts(nfts.map(n => 
        n.id === selectedNFT.id ? { ...n, ...nftForm } : n
      ));
      
      resetForm();
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating NFT:', error);
      toast({
        title: "Failed to update NFT",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNFT = async (nft: NFT) => {
    try {
      // Check if NFT is owned by any users
      const { count, error: checkError } = await supabase
        .from('user_nfts')
        .select('*', { count: 'exact', head: true })
        .eq('nft_id', nft.id);
        
      if (checkError) throw checkError;
      
      if (count && count > 0) {
        toast({
          title: "Cannot delete NFT",
          description: `This NFT is owned by ${count} users and cannot be deleted`,
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('nfts')
        .delete()
        .eq('id', nft.id);
        
      if (error) throw error;
      
      toast({
        title: "NFT Deleted",
        description: `${nft.name} has been deleted successfully`
      });
      
      // Update local state
      setNfts(nfts.filter(n => n.id !== nft.id));
    } catch (error: any) {
      console.error('Error deleting NFT:', error);
      toast({
        title: "Failed to delete NFT",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNftForm({
      name: '',
      description: '',
      tier: 'bronze',
      boost_percentage: 5,
      price: 100,
      image_url: ''
    });
    setSelectedNFT(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">NFT Management</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={fetchNFTs}>
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create New NFT</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New NFT</DialogTitle>
                <DialogDescription>
                  Add a new NFT to the marketplace
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nft-name">Name</Label>
                  <Input
                    id="nft-name"
                    value={nftForm.name}
                    onChange={(e) => setNftForm({...nftForm, name: e.target.value})}
                    placeholder="Cosmic Miner"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nft-description">Description</Label>
                  <Textarea
                    id="nft-description"
                    value={nftForm.description}
                    onChange={(e) => setNftForm({...nftForm, description: e.target.value})}
                    placeholder="A cosmic miner NFT that boosts your mining rate"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nft-tier">Tier</Label>
                    <Select 
                      value={nftForm.tier} 
                      onValueChange={(value) => setNftForm({...nftForm, tier: value as 'bronze' | 'silver' | 'gold'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nft-boost">Boost Percentage</Label>
                    <Input
                      id="nft-boost"
                      type="number"
                      min={0}
                      value={nftForm.boost_percentage}
                      onChange={(e) => setNftForm({...nftForm, boost_percentage: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nft-price">Price (tokens)</Label>
                  <Input
                    id="nft-price"
                    type="number"
                    min={0}
                    value={nftForm.price}
                    onChange={(e) => setNftForm({...nftForm, price: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nft-image">Image URL</Label>
                  <Input
                    id="nft-image"
                    value={nftForm.image_url}
                    onChange={(e) => setNftForm({...nftForm, image_url: e.target.value})}
                    placeholder="https://example.com/nft.png"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNFT}>
                  Create NFT
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">NFT</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Boost</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading NFTs...
                </TableCell>
              </TableRow>
            ) : nfts.length > 0 ? (
              nfts.map((nft) => (
                <TableRow key={nft.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded bg-gray-100 overflow-hidden">
                        <img src={nft.image_url} alt={nft.name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div>{nft.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {nft.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{nft.tier}</TableCell>
                  <TableCell>{nft.boost_percentage}%</TableCell>
                  <TableCell>{nft.price} $WAVES</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditNFT(nft)}>
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteNFT(nft)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No NFTs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit NFT</DialogTitle>
            <DialogDescription>
              Modify NFT details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nft-name">Name</Label>
              <Input
                id="edit-nft-name"
                value={nftForm.name}
                onChange={(e) => setNftForm({...nftForm, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-nft-description">Description</Label>
              <Textarea
                id="edit-nft-description"
                value={nftForm.description}
                onChange={(e) => setNftForm({...nftForm, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nft-tier">Tier</Label>
                <Select 
                  value={nftForm.tier} 
                  onValueChange={(value) => setNftForm({...nftForm, tier: value as 'bronze' | 'silver' | 'gold'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-nft-boost">Boost Percentage</Label>
                <Input
                  id="edit-nft-boost"
                  type="number"
                  min={0}
                  value={nftForm.boost_percentage}
                  onChange={(e) => setNftForm({...nftForm, boost_percentage: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-nft-price">Price (tokens)</Label>
              <Input
                id="edit-nft-price"
                type="number"
                min={0}
                value={nftForm.price}
                onChange={(e) => setNftForm({...nftForm, price: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-nft-image">Image URL</Label>
              <Input
                id="edit-nft-image"
                value={nftForm.image_url}
                onChange={(e) => setNftForm({...nftForm, image_url: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNFT}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
