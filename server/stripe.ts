import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be limited.');
}

// Initialize Stripe with the secret key from environment variables
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', // Use the latest API version
    })
  : null;

// Create a Stripe checkout session for subscription
export async function createCheckoutSession(priceId: string, customerId?: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.APP_URL || 'http://localhost:3000'}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/subscription?canceled=true`,
    customer: customerId,
  });

  return session;
}

// Create a Stripe customer
export async function createCustomer(email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  const customer = await stripe.customers.create({
    email,
    name,
  });

  return customer;
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  return await stripe.subscriptions.cancel(subscriptionId);
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Create Stripe price objects for your subscription plans
export async function setupStripePrices() {
  if (!stripe) {
    console.warn('Stripe is not initialized. Skipping price setup.');
    return null;
  }

  try {
    // Check if products already exist
    const products = await stripe.products.list({ limit: 100 });
    const existingProducts = products.data.map(p => p.name.toLowerCase());

    // Create products and prices if they don't exist
    const priceIds = {
      free: null, // Free tier doesn't need a price
      light: '',
      pro: '',
      enterprise: ''
    };

    // Light tier
    if (!existingProducts.includes('light')) {
      const lightProduct = await stripe.products.create({
        name: 'Light',
        description: 'Enhanced asset tracking for growing teams',
      });
      
      const lightPrice = await stripe.prices.create({
        product: lightProduct.id,
        unit_amount: 1999, // $19.99
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      
      priceIds.light = lightPrice.id;
    } else {
      // Find existing price
      const product = products.data.find(p => p.name.toLowerCase() === 'light');
      if (product) {
        const prices = await stripe.prices.list({ product: product.id, active: true });
        if (prices.data.length > 0) {
          priceIds.light = prices.data[0].id;
        }
      }
    }

    // Pro tier
    if (!existingProducts.includes('pro')) {
      const proProduct = await stripe.products.create({
        name: 'Pro',
        description: 'Professional asset management for businesses',
      });
      
      const proPrice = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 4999, // $49.99
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      
      priceIds.pro = proPrice.id;
    } else {
      // Find existing price
      const product = products.data.find(p => p.name.toLowerCase() === 'pro');
      if (product) {
        const prices = await stripe.prices.list({ product: product.id, active: true });
        if (prices.data.length > 0) {
          priceIds.pro = prices.data[0].id;
        }
      }
    }

    // Enterprise tier (custom pricing, but we'll create a product for it)
    if (!existingProducts.includes('enterprise')) {
      const enterpriseProduct = await stripe.products.create({
        name: 'Enterprise',
        description: 'Custom asset management solutions for large organizations',
      });
      
      // We don't create a fixed price for Enterprise as it's custom priced
    }

    return priceIds;
  } catch (error) {
    console.error('Error setting up Stripe prices:', error);
    return null;
  }
}
