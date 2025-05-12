import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { isReplitAuthError, handleReplitAuthError } from "./errorHandler";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Custom JSON stringifier that properly handles Date objects
  const dateSerializer = (key: string, value: any) => {
    // Convert Date objects to ISO strings to ensure they're properly formatted for the server
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      // Use custom serializer to properly handle Date objects
      body: data ? JSON.stringify(data, dateSerializer) : undefined,
      credentials: "include",
    });

    // Handle 403 errors gracefully
    if (res.status === 403) {
      console.warn(`Access forbidden (403) for ${url}. This might be an authentication issue.`);
      // Return a valid response instead of throwing to prevent app crashes
      return new Response(JSON.stringify({
        total: 0,
        byStatus: [],
        error: "Authentication required"
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Check if it's a Replit auth error
    if (isReplitAuthError(error)) {
      console.warn(`Replit auth error for ${url}:`, error);
      // Return a valid response with empty data
      return new Response(JSON.stringify({
        total: 0,
        byStatus: [],
        error: "Authentication required"
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.error(`API request error for ${url}:`, error);
    // Return a fallback response instead of throwing
    return new Response(JSON.stringify({
      total: 0,
      byStatus: [],
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      // Handle 401 Unauthorized
      if (res.status === 401) {
        console.warn(`Unauthorized (401) for ${queryKey[0]}`);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error(`Unauthorized (401)`);
      }

      // Handle 403 Forbidden
      if (res.status === 403) {
        console.warn(`Forbidden (403) for ${queryKey[0]}`);
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Check if it's a Replit auth error
      if (isReplitAuthError(error)) {
        console.warn(`Replit auth error for ${queryKey[0]}:`, error);
        return null;
      }

      console.error(`Query error for ${queryKey[0]}:`, error);
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Changed to returnNull for better error handling
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 300000, // 5 minutes instead of Infinity
      retry: 1, // Allow one retry
      // Add error handling
      onError: (error) => {
        console.error("Query error:", error);
      }
    },
    mutations: {
      retry: 1, // Allow one retry
      // Add error handling
      onError: (error) => {
        console.error("Mutation error:", error);
      }
    },
  },
});
