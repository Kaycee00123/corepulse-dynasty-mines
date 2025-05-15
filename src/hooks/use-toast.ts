
import { Toast } from "@radix-ui/react-toast";
import { type ToastActionElement, ToastProps } from "@/components/ui/toast";

// Define the toast parameter types
type ToastParameters = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

// Create a state to store toasts
const toasts: ToastParameters[] = [];

// Create a counter for unique IDs
let toastCounter = 0;

// Function to add a toast
export function toast(props: ToastParameters) {
  const id = toastCounter++;
  const toastProps = { id, ...props };
  toasts.push(toastProps);
  return id;
}

// Hook to use toast in components
export function useToast() {
  return {
    toast,
    toasts,
    dismiss: (id: number | string) => {
      const index = toasts.findIndex(toast => toast.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
      }
    }
  };
}
