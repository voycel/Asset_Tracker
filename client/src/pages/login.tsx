import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-blue-200 to-blue-50 p-4">
      <Card className="mx-auto w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Asset Track Pro
          </CardTitle>
          <CardDescription>
            Log in to manage and track your organization's assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Securely manage your assets with our comprehensive tracking system
            </p>
            <ul className="text-sm text-muted-foreground mt-4 space-y-1">
              <li>✓ Real-time asset tracking</li>
              <li>✓ Customizable asset types and fields</li>
              <li>✓ Detailed reporting and analytics</li>
              <li>✓ Secure access control</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Sign in to continue"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}