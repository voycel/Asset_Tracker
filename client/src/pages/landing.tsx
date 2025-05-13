import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { ArrowRight, BarChartHorizontal, Box, ClipboardList, Settings } from "lucide-react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAuthenticated, setLocation]);

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById("features");
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className={`fixed top-0 w-full transition-all duration-300 z-50 ${scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"}`}>
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex items-center">
            <Box className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Asset Track Pro
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Features
            </button>
            <button
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Pricing
            </button>
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            >
              Sign In
            </Button>
          </div>
          <div className="md:hidden">
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Track and Manage Your Assets with Ease
              </h1>
              <p className="text-lg text-gray-600">
                A complete solution for businesses to track, manage, and optimize their asset inventory with powerful customization options.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                  size="lg"
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={handleLearnMore}
                  variant="outline"
                  size="lg"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-xl transform rotate-1 border border-blue-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg shadow-inner">
                  <Box className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-medium text-blue-900">Electronics</h3>
                  <p className="text-sm text-blue-700 mt-1">24 items tracked</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow-inner">
                  <Settings className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-medium text-green-900">Equipment</h3>
                  <p className="text-sm text-green-700 mt-1">16 items tracked</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg shadow-inner">
                  <ClipboardList className="h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-medium text-purple-900">Furniture</h3>
                  <p className="text-sm text-purple-700 mt-1">32 items tracked</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg shadow-inner">
                  <BarChartHorizontal className="h-8 w-8 text-yellow-600 mb-2" />
                  <h3 className="font-medium text-yellow-900">Reports</h3>
                  <p className="text-sm text-yellow-700 mt-1">Real-time analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Asset Management</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to efficiently track and manage your organization's assets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-fit mb-4">
                <Box className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable Asset Types</h3>
              <p className="text-gray-600">
                Create and customize different asset types with unique fields and properties to match your organization's needs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-green-100 text-green-600 p-3 rounded-full w-fit mb-4">
                <BarChartHorizontal className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-gray-600">
                Monitor assets in real-time with status updates, location tracking, and assignment management.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-full w-fit mb-4">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Reports</h3>
              <p className="text-gray-600">
                Generate detailed reports with filtering options to gain insights on asset utilization and status.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
              size="lg"
            >
              Start Tracking Your Assets Now
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select the right subscription tier for your asset tracking needs
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Free Tier */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">Free</h3>
                <div className="text-3xl font-bold my-4">$0</div>
                <p className="text-gray-600 mb-4">Basic asset tracking for individuals and small teams</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Up to 25 assets
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Up to 2 users
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Basic asset tracking
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Limited reporting
                </li>
              </ul>
              <Button
                onClick={handleGetStarted}
                className="w-full"
                variant="outline"
              >
                Get Started
              </Button>
            </div>

            {/* Light Tier */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-blue-200">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-blue-600">Light</h3>
                <div className="text-3xl font-bold my-4">$19.99<span className="text-sm font-normal text-gray-500">/month</span></div>
                <p className="text-gray-600 mb-4">Enhanced asset tracking for growing teams</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Up to 100 assets
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Up to 5 users
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Advanced asset tracking
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Basic reporting
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Email support
                </li>
              </ul>
              <Button
                onClick={handleGetStarted}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            </div>

            {/* Pro Tier */}
            <div className="bg-white p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow border-2 border-green-500 transform scale-105 relative">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                POPULAR
              </div>
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-green-600">Pro</h3>
                <div className="text-3xl font-bold my-4">Free<span className="text-sm font-normal text-gray-500">/month</span></div>
                <p className="text-gray-600 mb-4">Professional asset management for businesses</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Up to 500 assets
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Up to 15 users
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Advanced asset tracking
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Comprehensive reporting
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Priority email support
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  API access
                </li>
              </ul>
              <Button
                onClick={handleGetStarted}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Get Started
              </Button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-purple-200">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-purple-600">Enterprise</h3>
                <div className="text-3xl font-bold my-4">Custom</div>
                <p className="text-gray-600 mb-4">Custom asset management solutions for large organizations</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Unlimited assets
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Unlimited users
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Advanced asset tracking
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Custom reporting
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Dedicated support
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Custom integrations
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  SLA guarantees
                </li>
              </ul>
              <Button
                onClick={handleGetStarted}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Box className="h-6 w-6 text-blue-400 mr-2" />
                <span className="font-bold text-xl text-white">Asset Track Pro</span>
              </div>
              <p className="text-gray-400">
                The all-in-one solution for asset management and tracking.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Customizable Asset Types</li>
                <li>Real-time Tracking</li>
                <li>Reporting & Analytics</li>
                <li>User Management</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Support</li>
                <li>Community</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} Asset Track Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}