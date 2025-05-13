import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Mail } from "lucide-react";
// import { apiRequest } from "@/lib/queryClient"; // Not needed for testing
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features: string[];
  assetLimit: number | null;
  userLimit: number | null;
}

interface Subscription {
  id: number;
  workspaceId: number;
  planId: number;
  status: string;
  startDate: string;
  endDate: string | null;
}

export default function Subscription() {
  // Simplified state for testing
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  // Removed active subscription state for testing
  const [isLoading] = useState(false); // Set to false to avoid loading spinner
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });
  const { toast } = useToast();
  // Not using currentWorkspace for now
  const { } = useAppContext();

  // Temporarily disabled subscription data fetching
  useEffect(() => {
    // Define mock subscription plans with all plans set to free for testing
    const mockPlans: SubscriptionPlan[] = [
      {
        id: 1,
        name: 'Free',
        description: 'Basic asset tracking for small teams',
        price: 0,
        billingCycle: 'monthly',
        features: [
          'Up to 25 assets',
          'Up to 3 users',
          'Basic asset tracking',
          'Community support'
        ],
        assetLimit: 25,
        userLimit: 3
      },
      {
        id: 2,
        name: 'Light',
        description: 'Enhanced asset tracking for growing teams',
        price: 0, // Set to free
        billingCycle: 'monthly',
        features: [
          'Up to 100 assets',
          'Up to 5 users',
          'Advanced asset tracking',
          'Basic reporting',
          'Email support'
        ],
        assetLimit: 100,
        userLimit: 5
      },
      {
        id: 3,
        name: 'Pro',
        description: 'Professional asset management for businesses',
        price: 0, // Set to free
        billingCycle: 'monthly',
        features: [
          'Up to 500 assets',
          'Up to 15 users',
          'Advanced asset tracking',
          'Comprehensive reporting',
          'Priority email support',
          'API access'
        ],
        assetLimit: 500,
        userLimit: 15
      },
      {
        id: 4,
        name: 'Enterprise',
        description: 'Custom asset management solutions for large organizations',
        price: 0, // Already free
        billingCycle: 'monthly',
        features: [
          'Unlimited assets',
          'Unlimited users',
          'Advanced asset tracking',
          'Custom reporting',
          'Dedicated support',
          'API access',
          'Custom integrations',
          'SLA guarantees'
        ],
        assetLimit: null,
        userLimit: null
      }
    ];

    setPlans(mockPlans);

    // No active subscription fetching for now
  }, []);

  // Simplified subscription handler for testing
  const handleSubscribe = (planId: number) => {
    // For Enterprise plan, open contact form
    const enterprisePlan = plans.find(p => p.name === 'Enterprise');
    if (enterprisePlan && planId === enterprisePlan.id) {
      setIsContactModalOpen(true);
      return;
    }

    // Show a toast message instead of making API calls
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      toast({
        title: "Tier Selection",
        description: `You've selected the ${plan.name} tier. All features from this tier are available for testing.`,
      });
    }
  };

  // Simplified contact form handler for testing
  const handleContactSubmit = () => {
    setIsContactModalOpen(false);
    setContactForm({
      name: '',
      email: '',
      company: '',
      phone: '',
      message: ''
    });
    toast({
      title: "Enterprise Tier Selected",
      description: "You've selected the Enterprise tier. All Enterprise features are available for testing.",
    });
  };

  // Modified to always return "Free" regardless of price
  const formatPrice = (_price: number, _billingCycle: string) => {
    return "Free";
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Feature Tiers"
          onMenuClick={() => {}} // Empty function to satisfy prop requirements
        />

        <main className="flex-1 overflow-x-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Feature Tiers</h2>
            <p className="text-neutral-500">
              Choose the right feature set for your asset tracking needs
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Subscription info section temporarily disabled */}
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-800">Feature Tiers</h3>
                    <p className="text-blue-600">
                      All feature tiers are currently <strong>available</strong> for testing
                    </p>
                    <p className="text-sm text-blue-500 mt-1">
                      Select the tier that best fits your organization's needs
                    </p>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-blue-600 text-sm">Testing Mode</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className={`hover:shadow-md transition-shadow ${plan.name === 'Enterprise' ? 'border-purple-200' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant={plan.name === 'Free' ? 'outline' : 'default'} className={
                          plan.name === 'Light' ? 'bg-blue-500' :
                          plan.name === 'Pro' ? 'bg-green-500' :
                          plan.name === 'Enterprise' ? 'bg-purple-500' : ''
                        }>
                          {plan.name}
                        </Badge>
                        <div className="text-2xl font-bold">
                          {formatPrice(plan.price, plan.billingCycle)}
                        </div>
                      </div>
                      <CardDescription className="mt-4">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={plan.name === 'Enterprise' ? 'outline' : 'default'}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {plan.name === 'Enterprise' ? (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Request Info
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Select Tier
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enterprise Tier Information</DialogTitle>
            <DialogDescription>
              Fill out this form to select the Enterprise tier for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                value={contactForm.company}
                onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleContactSubmit}>Select Enterprise Tier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
