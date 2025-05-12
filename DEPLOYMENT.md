# Deployment Guide for Asset Tracker

This guide will help you deploy the Asset Tracker application to Vercel with a Supabase or Neon PostgreSQL database and Stripe integration.

## Prerequisites

1. A [Vercel](https://vercel.com/) account
2. A database provider account:
   - [Supabase](https://supabase.com/) (recommended) OR
   - [Neon](https://neon.tech/)
3. A [Stripe](https://stripe.com/) account for payment processing (optional)

## Step 1: Set Up Your Database

### Option A: Set Up Supabase (Recommended)

1. Sign up or log in to [Supabase](https://supabase.com/)
2. Create a new project
3. Set a secure database password
4. Choose a region closest to you
5. Once your project is created, go to "Settings" > "Database"
6. Scroll down to "Connection string" and select "URI"
7. Copy the connection string (it will look like `postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres`)
8. Replace `[YOUR-PASSWORD]` with the database password you set when creating the project

If you want to use Supabase Auth (optional):
1. Go to "Settings" > "API"
2. Copy the "Project URL" and "anon public" key

### Option B: Set Up Neon Database

1. Sign up or log in to [Neon](https://neon.tech/)
2. Create a new project
3. Once your project is created, go to the "Connection Details" tab
4. Copy the connection string (it should look like `postgresql://username:password@hostname:port/database`)

## Step 2: Set Up Stripe (Optional)

If you want to use Stripe for payment processing:

1. Sign up or log in to [Stripe](https://stripe.com/)
2. Go to the Developers > API keys section
3. Copy your publishable key (starts with `pk_test_` or `pk_live_`)
4. Copy your secret key (starts with `sk_test_` or `sk_live_`)
5. Set up webhook (optional):
   - Go to Developers > Webhooks
   - Add an endpoint with URL: `https://your-vercel-app.vercel.app/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret

## Step 3: Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to [Vercel](https://vercel.com/)
3. Click "Add New" > "Project"
4. Import your Git repository
5. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: dist
   - Install Command: `npm install`

6. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase or Neon PostgreSQL connection string
   - `SESSION_SECRET`: A random string for session encryption
   - `APP_URL`: Your Vercel app URL (e.g., `https://your-app.vercel.app`)

   If using Supabase Auth (optional):
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

   If using Stripe (optional):
   - `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret (if using webhooks)

7. Click "Deploy"

## Step 4: Run Database Migrations

After deployment, you need to run the database migrations:

1. Go to your Vercel project
2. Click on "Deployments" tab
3. Find your latest deployment and click on it
4. Go to "Functions" tab
5. Click on "Console" to open a terminal
6. Run the migration command:
   ```
   npx drizzle-kit push:pg
   ```

## Step 5: Verify Your Deployment

1. Visit your deployed application at the Vercel URL
2. Sign in and verify that you can access all features
3. Test the subscription system if you've set up Stripe

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` environment variable is correct
- Make sure your Neon database is active and accessible
- Check if your IP is allowed in Neon's access control settings

### Stripe Integration Issues

- Verify your Stripe API keys are correct
- Check that your webhook URL is correctly configured
- Look at the Stripe dashboard for any failed webhook events

### General Deployment Issues

- Check Vercel's deployment logs for any errors
- Verify all environment variables are set correctly
- Try redeploying if issues persist

## Maintenance

### Updating Your Application

1. Make changes to your code locally
2. Push changes to your Git repository
3. Vercel will automatically deploy the new version

### Database Schema Changes

When you make changes to your database schema:

1. Update the schema files locally
2. Generate migration files with `npx drizzle-kit generate:pg`
3. Push changes to your Git repository
4. After deployment, run `npx drizzle-kit push:pg` in the Vercel console

## Security Considerations

- Never commit sensitive information like API keys or database credentials to your repository
- Always use environment variables for sensitive information
- Regularly update dependencies to patch security vulnerabilities
- Set up proper authentication and authorization in your application

## Scaling

As your application grows:

- Consider upgrading your Neon database plan for more resources
- Set up monitoring and alerting for your application
- Implement caching strategies for frequently accessed data
- Optimize database queries for performance
