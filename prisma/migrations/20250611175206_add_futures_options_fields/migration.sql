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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
