/**
 * Global error handler for Replit authentication errors
 * 
 * This module provides utilities to handle Replit-specific authentication errors
 * that might occur during API requests.
 */

// Define the shape of Replit auth errors
interface ReplitAuthError {
  name: string;
  httpError: boolean;
  httpStatus: number;
  httpStatusText: string;
  code: number;
  message?: string;
}

// Check if an error is a Replit auth error
export function isReplitAuthError(error: any): error is ReplitAuthError {
  return (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    'code' in error &&
    error.code === 403
  );
}

// Install global error handler for unhandled promise rejections
export function installGlobalErrorHandler() {
  // Save the original window.onunhandledrejection
  const originalHandler = window.onunhandledrejection;

  // Set up our custom handler
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    
    // Check if it's a Replit auth error
    if (isReplitAuthError(error)) {
      // Prevent the error from being reported to the console
      event.preventDefault();
      
      console.warn('Replit authentication error intercepted:', error);
      
      // You could redirect to login page or show a notification here
      // For now, we'll just suppress the error
      
      return true;
    }
    
    // Call the original handler if it exists
    if (typeof originalHandler === 'function') {
      return originalHandler.call(window, event);
    }
    
    // Let other errors propagate normally
    return false;
  };
  
  console.log('Global error handler for Replit auth errors installed');
}

// Handle Replit auth errors in try/catch blocks
export function handleReplitAuthError(error: any): null {
  if (isReplitAuthError(error)) {
    console.warn('Replit authentication error handled:', error);
    // Return null or a default value
    return null;
  }
  
  // Re-throw other errors
  throw error;
}
