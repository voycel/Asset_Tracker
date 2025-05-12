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
import { Check, AlertCircle, CreditCard, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<{ subscription: Subscription, plan: SubscriptionPlan } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });
  const { toast } = useToast();
  const { currentWorkspace, user } = useAppContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription plans
        const plansResponse = await apiRequest("GET", "/api/subscription-plans");
        const plansData = await plansResponse.json();
        setPlans(plansData);

        // Fetch active subscription if available
        if (currentWorkspace) {
          try {
            const subscriptionResponse = await apiRequest("GET", `/api/workspaces/${currentWorkspace.id}/active-subscription`);
            if (subscriptionResponse.ok) {
              const subscriptionData = await subscriptionResponse.json();
              setActiveSubscription(subscriptionData);
            }
          } catch (error) {
            console.error("Error fetching active subscription:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
        toast({
          title: "Error",
          description: "Failed to load subscription information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentWorkspace, toast]);

  const handleSubscribe = async (planId: number) => {
    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected",
        variant: "destructive",
      });
      return;
    }

    // For Enterprise plan, open contact form
    const enterprisePlan = plans.find(p => p.name === 'Enterprise');
    if (enterprisePlan && planId === enterprisePlan.id) {
      setIsContactModalOpen(true);
      return;
    }

    try {
      // Create a checkout session with Stripe
      const response = await apiRequest("POST", "/api/checkout-session", {
        workspaceId: currentWorkspace.id,
        planId: planId,
      });

      if (response.ok) {
        const { url } = await response.json();

        // Redirect to Stripe Checkout
        if (url) {
          window.location.href = url;
        } else {
          // Fallback to the old subscription method if Stripe is not configured
          const subscriptionResponse = await apiRequest("POST", "/api/subscriptions", {
            workspaceId: currentWorkspace.id,
            planId: planId,
            status: "active",
            startDate: new Date().toISOString(),
          });

          if (subscriptionResponse.ok) {
            const subscription = await subscriptionResponse.json();
            const plan = plans.find(p => p.id === planId);
            if (plan) {
              setActiveSubscription({ subscription, plan });
              toast({
                title: "Success",
                description: `Successfully subscribed to ${plan.name} plan`,
              });
            }
          } else {
            throw new Error("Failed to create subscription");
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to subscribe to plan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast({
        title: "Error",
        description: "Failed to subscribe to plan",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    try {
      const response = await apiRequest("POST", `/api/subscriptions/${activeSubscription.subscription.id}/cancel`);
      if (response.ok) {
        setActiveSubscription(null);
        toast({
          title: "Success",
          description: "Subscription canceled successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  };

  const handleContactSubmit = async () => {
    try {
      const response = await apiRequest("POST", "/api/contact/enterprise", contactForm);
      if (response.ok) {
        setIsContactModalOpen(false);
        setContactForm({
          name: '',
          email: '',
          company: '',
          phone: '',
          message: ''
        });
        toast({
          title: "Success",
          description: "Your inquiry has been submitted. Our team will contact you shortly.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit inquiry",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: "Failed to submit inquiry",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number, billingCycle: string) => {
    if (price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`;
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Subscription"
        />

        <main className="flex-1 overflow-x-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Subscription Plans</h2>
            <p className="text-neutral-500">
              Choose the right plan for your asset tracking needs
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {activeSubscription && (
                <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-blue-800">Current Subscription</h3>
                      <p className="text-blue-600">
                        You are currently on the <strong>{activeSubscription.plan.name}</strong> plan
                      </p>
                      <p className="text-sm text-blue-500 mt-1">
                        {activeSubscription.subscription.status === 'active' ? 'Active' : 'Inactive'} since {new Date(activeSubscription.subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              )}

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
                          {plan.name === 'Enterprise' ? 'Custom' : formatPrice(plan.price, plan.billingCycle)}
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
                        disabled={activeSubscription?.plan.id === plan.id}
                      >
                        {plan.name === 'Enterprise' ? (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Contact Sales
                          </>
                        ) : activeSubscription?.plan.id === plan.id ? (
                          'Current Plan'
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Subscribe
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
            <DialogTitle>Contact our Enterprise Sales Team</DialogTitle>
            <DialogDescription>
              Fill out the form below and our team will get back to you to discuss your enterprise needs.
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
            <Button type="submit" onClick={handleContactSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
