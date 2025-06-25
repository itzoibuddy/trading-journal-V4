# Production Deployment Guide

## Phase 1 ✅ COMPLETED - Database & Performance Foundations
- ✅ Database connection pooling with retry logic
- ✅ User caching to prevent repeated User.findUnique calls  
- ✅ Pagination for admin trades (25 per page vs loading ALL)
- ✅ Memory leak fixes (MaxListenersExceededWarning resolved)
- ✅ NextAuth compatibility fixes
- ✅ Performance monitoring endpoint (`/api/performance`)
- ✅ Critical database indexes added to schema
- ✅ Environment variable validation

## Phase 2 ✅ COMPLETED - Production Optimizations
- ✅ AI Analytics TypeScript errors fixed
- ✅ Dynamic route optimization for API endpoints
- ✅ Next.js production configuration with security headers
- ✅ Query result caching system
- ✅ Rate limiting implementation
- ✅ Memory usage monitoring
- ✅ Production performance recommendations

## Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Copy and configure production environment
cp .env.production.template .env.production
# Edit .env.production with your production values
```

### 2. Database Setup
```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client for production
npx prisma generate

# Optional: Seed initial data
npx prisma db seed
```

### 3. Build Verification
```bash
# Test production build
npm run build

# Test production server locally
npm start
```

### 4. Security Configuration

**Required Environment Variables:**
- `NEXTAUTH_SECRET` - Minimum 32 characters, cryptographically secure
- `DATABASE_URL` - Production database with connection pooling
- `ENCRYPTION_KEY` - 32-character encryption key for sensitive data
- `JWT_SECRET` - Secure JWT signing key

**Security Headers (automatically configured):**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 5. Database Indexes (Already Applied)
The following indexes are configured in `prisma/schema.prisma`:

```sql
-- User table indexes
@@index([email])
@@index([role])
@@index([status])
@@index([email, status])
@@index([role, status])

-- Trade table indexes  
@@index([userId])
@@index([userId, entryDate])
@@index([userId, profitLoss])
@@index([symbol])
@@index([entryDate])
@@index([userId, symbol, entryDate])

-- AuditLog table indexes
@@index([action, createdAt])
```

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables via Vercel dashboard
```

### Option 2: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway link
railway up
```

### Option 3: Docker Production
```bash
# Build production image
docker build -t trading-journal .

# Run with production environment
docker run -p 3000:3000 --env-file .env.production trading-journal
```

### Option 4: Traditional VPS/Server
```bash
# Build application
npm run build

# Start with PM2 for process management
npm install -g pm2
pm2 start npm --name "trading-journal" -- start
pm2 startup
pm2 save
```

## Performance Monitoring

### Health Check Endpoint
```
GET /api/health
```
Response includes database connectivity and system status.

### Performance Monitoring 
```
GET /api/performance
```
Provides detailed performance metrics (requires authentication).

### Key Metrics to Monitor
- Database query response times (target: <500ms)
- Memory usage (alert if >512MB)
- Error rates (target: <1%)
- Cache hit rates (target: >80%)
- API response times (target: <2s)

## Production Optimizations Applied

### Database Performance
- **Connection Pooling**: Max 10 connections with retry logic
- **Query Optimization**: Selective field loading, pagination
- **Caching**: User data cached for 5 minutes
- **Indexes**: Comprehensive indexing strategy implemented

### Application Performance  
- **Bundle Optimization**: CSS optimization, React server optimization
- **Caching**: Static assets cached for 1 year
- **Compression**: Gzip compression enabled
- **Image Optimization**: WebP/AVIF formats with 7-day cache

### Security
- **Rate Limiting**: 100 requests per minute per IP
- **Security Headers**: Complete OWASP header set
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Production-safe error responses

### Monitoring & Alerting
- **Performance Tracking**: Real-time metrics collection
- **Memory Monitoring**: Automatic cleanup recommendations
- **Query Monitoring**: Slow query detection (>1s)
- **Health Checks**: Automated system health verification

## Post-Deployment Verification

### 1. Functional Testing
- [ ] User authentication (sign up, sign in, sign out)
- [ ] Trade CRUD operations
- [ ] Admin panel access and functionality
- [ ] Performance monitoring dashboard
- [ ] AI insights generation

### 2. Performance Testing
```bash
# Load testing (optional)
npx artillery quick --count 10 --num 100 https://yourdomain.com/api/health
```

### 3. Security Testing
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection  
- [ ] Rate limiting functionality
- [ ] Authentication bypass attempts

## Troubleshooting

### Common Issues
1. **Slow Queries**: Check `/api/performance` for query times
2. **Memory Leaks**: Monitor memory usage via performance endpoint
3. **Database Connections**: Verify connection pool settings
4. **Build Failures**: Ensure all environment variables are set

### Performance Optimization
- Enable caching for frequently accessed queries
- Implement database read replicas for heavy read operations
- Consider CDN for static assets
- Monitor and optimize bundle sizes

## Success Metrics
Your application is production-ready when:
- ✅ Build completes without errors
- ✅ All health checks pass
- ✅ Database queries average <500ms
- ✅ Memory usage stable <512MB
- ✅ Error rate <1%
- ✅ Authentication flows work correctly
- ✅ All core features functional

## Support
For production issues:
1. Check application logs
2. Review performance metrics at `/api/performance`
3. Verify environment configuration
4. Monitor database connection health 