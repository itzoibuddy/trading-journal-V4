# Prisma Configuration

This directory contains the Prisma schema and migrations for the Trading Journal application.

## Files

- `schema.prisma`: The main Prisma schema file that defines the database models
- `migrations/`: Directory containing database migrations
- `seed.ts`: Script to seed the database with initial data

## Database Configuration

The application uses PostgreSQL for production (on Vercel) and can use SQLite for local development. 