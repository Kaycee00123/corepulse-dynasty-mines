
import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Camera, Loader2 } from 'lucide-react';

interface AvatarUploaderProps {
  userId: string;
  existingUrl: string | null;
  onUploadComplete: (url: string) => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  userId,
  existingUrl,
  onUploadComplete
}) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      
      // Update the user's avatar_url in the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      onUploadComplete(publicUrl);
      
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your avatar.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="w-32 h-32 border-2 border-gray-200">
        <AvatarImage src={avatarUrl || ''} />
        <AvatarFallback className="text-3xl">
          {userId.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col items-center">
        <input
          type="file"
          id="avatar"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
        <Button 
          onClick={handleButtonClick}
          disabled={uploading}
          variant="outline"
          className="flex items-center"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              {avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-1">
          Allowed formats: JPEG, PNG (max 2MB)
        </p>
      </div>
    </div>
  );
};
