# Setting Up Asset Tracker with Supabase

This guide will help you set up and run the Asset Tracker application using Supabase for your database and authentication.

## Step 1: Create a Supabase Project

1. Sign up or log in to [Supabase](https://supabase.com/)
2. Click "New Project"
3. Enter a name for your project (e.g., "asset-tracker")
4. Set a secure database password (save this for later)
5. Choose a region closest to you
6. Click "Create new project"
7. Wait for your project to be created (usually takes about 1 minute)

## Step 2: Get Your Supabase Connection Details

1. Go to the Supabase dashboard for your project
2. Click on "Settings" in the left sidebar
3. Click on "Database"
4. Scroll down to "Connection string" and select "URI"
5. Copy the connection string (it will look like `postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres`)
6. Replace `[YOUR-PASSWORD]` with the database password you set when creating the project

## Step 3: Set Up Your Environment Variables

1. Create or update your `.env` file in the root directory of your project
2. Add the following variables:

```
# Database - Your Supabase connection string
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres

# Authentication
SESSION_SECRET=your-session-secret-here

# Supabase (optional - if you want to use Supabase Auth)
SUPABASE_URL=https://abcdefghijklm.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe (optional - if you want to use Stripe for payments)
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

For the Supabase URL and anon key:
1. Go to the Supabase dashboard for your project
2. Click on "Settings" in the left sidebar
3. Click on "API"
4. Copy the "Project URL" and "anon public" key

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run Database Migrations

This will create all the necessary tables in your Supabase database:

```bash
npm run db:push
```

## Step 6: Start the Development Server

```bash
npm run dev
```

## Step 7: Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

## Using Supabase Auth (Optional)

If you want to use Supabase Authentication instead of the built-in authentication:

1. Go to the Supabase dashboard for your project
2. Click on "Authentication" in the left sidebar
3. Go to "Providers" and enable the providers you want to use (Email, Google, GitHub, etc.)
4. Update your application code to use Supabase Auth

## Troubleshooting

### Database Connection Issues

- Make sure your DATABASE_URL in the `.env` file is correct
- Ensure you've replaced `[YOUR-PASSWORD]` with your actual database password
- Check that SSL is enabled in your connection (this is handled automatically in our setup)

### Migration Errors

If you encounter errors during migration:

1. Go to the Supabase dashboard for your project
2. Click on "Table Editor" in the left sidebar
3. You can manually create tables if needed, but it's better to fix the migration issues

### Authentication Issues

- If using the built-in authentication, make sure SESSION_SECRET is set
- If using Supabase Auth, ensure SUPABASE_URL and SUPABASE_ANON_KEY are correct

## Deploying to Production

When deploying to production:

1. Set up your production environment variables
2. Build the application: `npm run build`
3. Start the production server: `npm start`

For Vercel deployment, follow the instructions in DEPLOYMENT.md and use your Supabase connection details.

## Additional Supabase Features

Supabase offers many features beyond just a PostgreSQL database:

- **Authentication**: User sign-up, login, and management
- **Storage**: File storage and management
- **Edge Functions**: Serverless functions
- **Realtime**: Real-time database changes
- **Vector**: AI vector embeddings

To use these features, refer to the [Supabase documentation](https://supabase.com/docs).
