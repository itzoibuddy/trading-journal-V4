# Trading Journal

A comprehensive trading journal application for tracking and analyzing your trades.

## Features

- **Trade Tracking**: Log your trades with detailed information including entry/exit prices, P&L, and more
- **Advanced Journal Features**: Record emotions, confidence levels, lessons learned, and trade setups
- **Calendar View**: Visualize your trading activity and P&L on a calendar
- **Analytics Dashboard**: View performance metrics and charts
- **Risk Management**: Track your risk-reward ratios and analyze your trading patterns

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Prisma ORM with SQLite (development) or PostgreSQL (production)
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/trading-journal.git
   cd trading-journal
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up the database
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Configuration

The application uses SQLite by default for development. To use PostgreSQL in production:

1. Edit `prisma/schema.prisma` and uncomment the PostgreSQL configuration
2. Set the `DATABASE_URL` environment variable to your PostgreSQL connection string

## Production Deployment

### Build for Production

```bash
npm run build
```

This will:
1. Run database migrations
2. Generate the Prisma client
3. Build the Next.js application

### Start the Production Server

```bash
npm start
```

### Deployment Options

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Docker**: A Dockerfile is provided for containerized deployments
- **Traditional Hosting**: Deploy the built application to any Node.js hosting service

## Deployment on Vercel

### Prerequisites
1. A Vercel account linked to your GitHub repository
2. A PostgreSQL database (we use Neon DB)

### Steps to Deploy
1. Push your code to GitHub
2. Create a new project in Vercel and connect it to your GitHub repository
3. Set the following environment variables in Vercel:
   - `DATABASE_URL`: Your PostgreSQL connection string (from Neon DB)
4. Deploy the project

If you encounter "No Next.js version detected" error:
1. Make sure your repository structure matches your local project
2. Verify that package.json is at the root of your repository
3. Ensure Next.js is listed in the dependencies section of package.json

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Next.js, Prisma, and TailwindCSS
- Chart visualizations powered by Chart.js
