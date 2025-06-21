-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "emailVerified" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'TRADER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "bio" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "defaultRiskRatio" REAL DEFAULT 2.0,
    "tradingExperience" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionPlan" TEXT DEFAULT 'free',
    "subscriptionEnd" DATETIME,
    "tradeLimit" INTEGER DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "instrumentType" TEXT NOT NULL DEFAULT 'STOCK',
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL,
    "quantity" REAL NOT NULL,
    "strikePrice" REAL,
    "expiryDate" DATETIME,
    "optionType" TEXT,
    "premium" REAL,
    "entryDate" DATETIME NOT NULL,
    "exitDate" DATETIME,
    "profitLoss" REAL,
    "notes" TEXT,
    "sector" TEXT,
    "strategy" TEXT,
    "setupImageUrl" TEXT,
    "setupDescription" TEXT,
    "preTradeEmotion" TEXT,
    "postTradeEmotion" TEXT,
    "tradeConfidence" INTEGER,
    "confidenceLevel" INTEGER,
    "tradeRating" INTEGER,
    "rating" INTEGER,
    "lessons" TEXT,
    "lessonsLearned" TEXT,
    "riskRewardRatio" REAL,
    "stopLoss" REAL,
    "targetPrice" REAL,
    "timeFrame" TEXT,
    "marketCondition" TEXT,
    "userId" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");

-- CreateIndex
CREATE INDEX "Trade_userId_entryDate_idx" ON "Trade"("userId", "entryDate");

-- CreateIndex
CREATE INDEX "Trade_userId_isDemo_idx" ON "Trade"("userId", "isDemo");

-- CreateIndex
CREATE INDEX "Trade_symbol_entryDate_idx" ON "Trade"("symbol", "entryDate");

-- CreateIndex
CREATE INDEX "Trade_entryDate_idx" ON "Trade"("entryDate");

-- CreateIndex
CREATE INDEX "Trade_exitDate_idx" ON "Trade"("exitDate");

-- CreateIndex
CREATE INDEX "Trade_instrumentType_idx" ON "Trade"("instrumentType");

-- CreateIndex
CREATE INDEX "Trade_type_idx" ON "Trade"("type");

-- CreateIndex
CREATE INDEX "Trade_profitLoss_idx" ON "Trade"("profitLoss");

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
