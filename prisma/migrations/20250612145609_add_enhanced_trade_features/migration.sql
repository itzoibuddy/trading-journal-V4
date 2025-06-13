-- AlterTable
ALTER TABLE "Trade" ADD COLUMN "lessons" TEXT;
ALTER TABLE "Trade" ADD COLUMN "marketCondition" TEXT;
ALTER TABLE "Trade" ADD COLUMN "postTradeEmotion" TEXT;
ALTER TABLE "Trade" ADD COLUMN "preTradeEmotion" TEXT;
ALTER TABLE "Trade" ADD COLUMN "riskRewardRatio" REAL;
ALTER TABLE "Trade" ADD COLUMN "setupImageUrl" TEXT;
ALTER TABLE "Trade" ADD COLUMN "stopLoss" REAL;
ALTER TABLE "Trade" ADD COLUMN "strategy" TEXT;
ALTER TABLE "Trade" ADD COLUMN "targetPrice" REAL;
ALTER TABLE "Trade" ADD COLUMN "timeFrame" TEXT;
ALTER TABLE "Trade" ADD COLUMN "tradeConfidence" INTEGER;
ALTER TABLE "Trade" ADD COLUMN "tradeRating" INTEGER;
