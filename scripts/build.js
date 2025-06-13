#!/usr/bin/env node

/**
 * Production build script for Trading Journal
 * 
 * This script:
 * 1. Runs database migrations
 * 2. Builds the Next.js application
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Utility to run commands and log output
function runCommand(command) {
  console.log(`\n> ${command}\n`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to execute ${command}`);
    throw error;
  }
}

// Main build function
async function build() {
  console.log('\n🚀 Starting Trading Journal production build...\n');

  try {
    // Check if we're using SQLite or PostgreSQL
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const isPostgres = schemaContent.includes('provider = "postgresql"') && 
                       !schemaContent.includes('// provider = "postgresql"');

    console.log(`Database provider: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);

    // 1. Run database migrations
    console.log('\n📊 Running database migrations...');
    runCommand('npx prisma migrate deploy');

    // 2. Generate Prisma client
    console.log('\n🔄 Generating Prisma client...');
    runCommand('npx prisma generate');

    // 3. Build Next.js app
    console.log('\n🏗️ Building Next.js application...');
    runCommand('next build');

    console.log('\n✅ Production build completed successfully!');
    
    // Instructions for deployment
    console.log('\n📝 Deployment instructions:');
    console.log('  1. Start the application: npm start');
    if (isPostgres) {
      console.log('  2. Make sure your DATABASE_URL environment variable is set correctly');
    }
    
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build
build(); 