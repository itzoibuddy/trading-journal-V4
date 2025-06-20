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
