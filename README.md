# 📊 Trading Journal

A comprehensive trading analytics platform to track, analyze, and optimize your trading performance with **AI-powered insights**.

## 🚀 New Features: Advanced AI Insights (No External APIs)

### 🤖 **Advanced Local AI Engine**
Sophisticated AI analytics running entirely in your browser - no external API calls, no data sharing:

#### **🧠 Neural Network Concepts**
- **Gradient Descent Learning**: Self-training weights based on your trading history
- **Feature Engineering**: Extracts 9+ key features from each trade
- **Sigmoid Activation**: Neural network-style probability calculations
- **Real-time Learning**: Model improves as you add more trades

#### **🔬 Machine Learning Algorithms**
- **K-Means Clustering**: Groups similar trading patterns
- **Sequential Pattern Mining**: Identifies winning/losing trade sequences  
- **Time Series Analysis**: Detects cycles, trends, and volatility regimes
- **Anomaly Detection**: Spots unusual patterns in your trading
- **Ensemble Methods**: Combines multiple algorithms for robust insights

#### **📊 Advanced Pattern Recognition**
- **Complex Patterns**: Multi-dimensional pattern analysis
- **Statistical Significance**: P-value calculations for pattern validity
- **Confidence Scoring**: Neural network confidence for each insight
- **Predictive Power**: How well patterns predict future performance

### 💡 **Daily Recommendations (Enhanced)**
- **Performance Alerts**: ML-powered streak detection
- **Risk-Reward Optimization**: Advanced ratio analysis
- **Optimal Timing**: Statistical analysis of best trading hours
- **Strategy Performance**: Algorithm-based strategy ranking
- **Behavioral Insights**: Pattern recognition of emotional trading

### 🔮 **Performance Forecasting**
- **Next Trade Probability**: Neural network success prediction
- **Expected Return Calculation**: Trend analysis + moving averages
- **Confidence Intervals**: Statistical uncertainty ranges
- **Optimal Position Sizing**: Kelly Criterion implementation
- **Risk-Adjusted Returns**: Sharpe ratio-style calculations
- **Model Accuracy Tracking**: Self-monitoring AI performance

### 🧠 **Advanced AI Insights**
- **Market Regime Detection**: Hidden Markov Model concepts
- **Behavioral Finance Analysis**: Cognitive bias detection
- **Portfolio Optimization**: Mathematical optimization techniques
- **Technical Analysis**: Momentum, volatility, mean reversion factors
- **Ensemble Voting**: Multiple algorithms consensus-building

## 🎯 **AI System Architecture**

### **Tier 1: Rule-Based Analytics** ✅
- Statistical analysis and basic pattern recognition
- Instant results, works with 3+ trades
- Win rates, risk metrics, time analysis

### **Tier 2: Neural Network Engine** ✅  
- Local gradient descent training
- Feature extraction and learning
- Probability calculations and predictions

### **Tier 3: Machine Learning Algorithms** ✅
- Clustering, time series, anomaly detection
- Requires 10+ trades for activation
- Advanced pattern mining and forecasting

### **Tier 4: Ensemble AI** ✅
- Multiple algorithm consensus
- Highest accuracy predictions
- Sophisticated market analysis

## 📈 **Key Technical Features**

### **🔒 Privacy-First Design**
- **100% Local Processing**: All AI runs in your browser
- **No External APIs**: No OpenAI, Claude, or other service calls
- **No Data Sharing**: Your trading data never leaves your device
- **Offline Capable**: Works without internet connection

### **⚡ Performance Optimized**
- **Instant Analysis**: No API delays or rate limits
- **Real-time Learning**: Model updates with each new trade
- **Memory Efficient**: Optimized algorithms for browser environment
- **Scalable**: Handles growing trade datasets efficiently

### **🧪 Scientifically Sound**
- **Statistical Rigor**: P-value calculations and significance testing
- **Mathematical Foundation**: Linear regression, Kelly criterion, standard deviation
- **Validated Algorithms**: Based on proven trading and ML techniques
- **Continuous Learning**: Self-improving accuracy over time

## 🎯 **How to Use AI Insights**

1. **Add Trades**: Log at least 3-5 completed trades with details
2. **Visit AI Insights**: Go to `/ai-insights` page
3. **Review Daily Recommendations**: Start with the "Daily Recommendations" tab
4. **Implement Actions**: Follow the specific recommendations provided
5. **Track Progress**: As you add more trades, insights become more accurate

## 📈 **Key Benefits**

- **Immediate Actionable Feedback**: No guesswork - get specific actions to improve
- **Data-Driven Decisions**: Based on your actual trading patterns
- **Performance Optimization**: Identify and leverage your strengths
- **Risk Reduction**: Early warning system for dangerous patterns
- **Continuous Learning**: Insights improve as you trade more

## 🚀 Production Updates

This application has been updated with critical production-ready features:

### Security Enhancements
- ✅ API rate limiting (100 requests/minute)
- ✅ CORS configuration and security headers
- ✅ Input sanitization with DOMPurify
- ✅ Environment variable validation
- ✅ Centralized error handling

### Performance Improvements
- ✅ Fixed database connection pooling with singleton pattern
- ✅ Added pagination for all API endpoints (max 100 records per page)
- ✅ Database indexes for faster queries
- ✅ Optimized Docker build with health checks

### Infrastructure & Quality
- ✅ PostgreSQL configuration for production
- ✅ Health check endpoint with database connectivity test
- ✅ Jest test configuration with basic unit tests
- ✅ TypeScript strict mode
- ✅ Production-ready middleware

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

3. Create a `.env` file based on `.env.example`:
   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/trading_journal"
   
   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # API Security
   ALLOWED_ORIGINS="http://localhost:3000"
   ```

4. Set up the database
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Configuration

The application is configured to use PostgreSQL by default. The schema includes:
- Optimized indexes for query performance
- Support for options and futures trading
- Comprehensive trade tracking fields

To switch between databases:
- **PostgreSQL** (recommended for production): Set `DATABASE_URL` in your `.env` file
- **SQLite** (for local development only): Update `prisma/schema.prisma` datasource

## Production Deployment

### Build for Production

```bash
# Install production dependencies
npm ci --production

# Run database migrations
npm run db:migrate

# Build the application
npm run build:prod
```

### Start the Production Server

```bash
npm run start:prod
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
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

# Updated for deployment

