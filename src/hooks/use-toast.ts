
import { toast as sonnerToast } from "sonner";

// Re-export the toast function with the correct implementation
export const toast = ({ title, description, variant }: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}) => {
  return sonnerToast(title, {
    description,
    // Map variants to sonner's types
    // For destructive, using "error" which is sonner's equivalent
    type: variant === "destructive" ? "error" : "default",
  });
};

// Create a custom hook that returns the toast function
export const useToast = () => {
  return {
    toast,
  };
};
