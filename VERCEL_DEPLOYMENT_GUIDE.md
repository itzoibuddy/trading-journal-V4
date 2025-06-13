# Vercel Deployment Guide for Trading Journal

This guide will help you deploy your Trading Journal application to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (you can sign up with your GitHub account)
3. A PostgreSQL database (recommended: [Neon](https://neon.tech/) or [Supabase](https://supabase.com/))

## Step 1: Set up a PostgreSQL Database

1. Sign up for a free PostgreSQL database service like Neon or Supabase
2. Create a new database
3. Get your database connection string (it will look something like: `postgresql://user:password@host:port/database`)

## Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New..." > "Project"
3. Import your GitHub repository (mytradingjournal)
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
   - Install Command: npm install

5. Add the following environment variable:
   - Name: `DATABASE_URL`
   - Value: Your PostgreSQL connection string from Step 1

6. Click "Deploy"

## Step 3: Check Deployment

1. Once deployment is complete, Vercel will provide you with a URL to access your application
2. Visit the URL to ensure your application is working correctly

## Troubleshooting

If you encounter any issues during deployment:

1. Check the Vercel deployment logs for errors
2. Ensure your PostgreSQL database is properly set up and accessible
3. Verify that your `prisma/schema.prisma` file is correctly configured for PostgreSQL
4. Make sure your environment variables are set correctly

## Next Steps

1. Set up a custom domain (optional)
2. Configure automatic deployments from GitHub
3. Set up additional environment variables if needed 