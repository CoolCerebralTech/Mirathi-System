// FILE: src/hooks/useToast.ts
import { toast as sonnerToast } from 'sonner';

// We re-export the toast function from the sonner library.
// This is a common pattern to create a consistent API for your own app.
// If you ever wanted to switch the toast library, you would only need to change this one file.
export const toast = sonnerToast;