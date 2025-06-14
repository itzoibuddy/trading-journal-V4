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

- **Netlify**: Connect your GitHub repository for automatic deployments
- **Docker**: A Dockerfile is provided for containerized deployments
- **Traditional Hosting**: Deploy the built application to any Node.js hosting service

## Project Maintenance

### Cleaning Build Artifacts

To keep your project directory size manageable, you can clean up build artifacts:

```bash
# Clean the Next.js build directory
npm run clean
```

For a more thorough cleanup before deployment or committing to version control:

```bash
# Remove node_modules (will need to run npm install again after)
rm -rf node_modules
npm run clean
```

This helps reduce the project size significantly when sharing or deploying.

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
