import { useQuery } from "@tanstack/react-query";
import { handleReplitAuthError } from "@/lib/errorHandler";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: 1,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    // Add error handling
    onError: (error) => {
      console.warn("Auth error:", error);
      try {
        // Try to handle Replit auth errors
        handleReplitAuthError(error);
      } catch (e) {
        // Log other errors
        console.error("Unhandled auth error:", e);
      }
    }
  });

  // Create a mock user for development if authentication fails
  const mockUser = {
    id: "local-dev-user",
    email: "local@example.com",
    first_name: "Local",
    last_name: "Developer",
    role: "admin"
  };

  // Use the real user if available, otherwise use mock user for development
  const effectiveUser = user || (process.env.NODE_ENV !== 'production' ? mockUser : null);

  return {
    user: effectiveUser,
    isLoading: isLoading && !effectiveUser,
    isAuthenticated: !!effectiveUser,
    error
  };
}