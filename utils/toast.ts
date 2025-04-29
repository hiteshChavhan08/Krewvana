// utils/toast.ts
// 👇 Importing the core toast function from the sonner library
import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast; // Re-export if needed

export const toastSuccess = (message: string, description?: string, options?: object) => {
  // 👇 Calling the imported function from sonner
  sonnerToast.success(message, { description, ...options });
};

export const toastError = (message: string, description?: string, options?: object) => {
  // 👇 Calling the imported function from sonner
  sonnerToast.error(message, { description, ...options });
};

// Add other variants (info, warning, message, promise) as needed
// export const toastPromise = sonnerToast.promise;