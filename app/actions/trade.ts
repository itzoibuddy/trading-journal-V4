'use server';

import { prisma } from '../lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  type: z.enum(['LONG', 'SHORT']),
  instrumentType: z.enum(['STOCK', 'FUTURES', 'OPTIONS']).default('STOCK'),
  entryPrice: z.number().positive('Entry price must be positive'),
  exitPrice: z.number().optional().nullable(),
  quantity: z.number().positive('Quantity must be positive'),
  strikePrice: z.number().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  optionType: z.enum(['CALL', 'PUT']).optional().nullable(),
  premium: z.number().optional().nullable(),
  entryDate: z.string(),
  exitDate: z.string().optional().nullable(),
  profitLoss: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  
  // New fields
  strategy: z.string().optional().nullable(),
  setupImageUrl: z.string().optional().nullable(),
  preTradeEmotion: z.string().optional().nullable(),
  postTradeEmotion: z.string().optional().nullable(),
  tradeConfidence: z.number().min(1).max(10).optional().nullable(),
  tradeRating: z.number().min(1).max(10).optional().nullable(),
  lessons: z.string().optional().nullable(),
  riskRewardRatio: z.number().optional().nullable(),
  stopLoss: z.number().optional().nullable(),
  targetPrice: z.number().optional().nullable(),
  timeFrame: z.string().optional().nullable(),
  marketCondition: z.string().optional().nullable(),
});

export type TradeFormData = z.infer<typeof tradeSchema>;

// Simple cache for user lookups to avoid repeated database hits
const userCache = new Map<string, { user: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedUser(email: string) {
  const cached = userCache.get(email)
  if (cached && cached.expires > Date.now()) {
    return cached.user
  }
  return null
}

function setCachedUser(email: string, user: any) {
  userCache.set(email, {
    user,
    expires: Date.now() + CACHE_TTL
  })
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  // Try cache first
  let user = getCachedUser(session.user.email)
  
  if (!user) {
    // Fetch from database if not cached
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true } // Only select what we need
    });
    
    if (user) {
      setCachedUser(session.user.email, user)
    }
  }

  return user;
}

export async function getTrades() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return [];
  }

  // Add pagination to prevent loading too many trades at once
  return prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { entryDate: 'desc' },
    take: 100 // Limit to 100 most recent trades
  });
}

export async function getTradesByDate(date: Date) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return [];
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return prisma.trade.findMany({
    where: {
      userId: user.id,
      entryDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { entryDate: 'desc' }
  });
}

// Helper function to format decimal values to 2 decimal places
const formatDecimal = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  return parseFloat(value.toFixed(2));
};

export async function createTrade(data: TradeFormData) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const validatedData = tradeSchema.parse(data);
    
    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        symbol: validatedData.symbol,
        type: validatedData.type,
        instrumentType: validatedData.instrumentType,
        entryPrice: formatDecimal(validatedData.entryPrice)!,
        exitPrice: formatDecimal(validatedData.exitPrice),
        quantity: validatedData.quantity,
        strikePrice: formatDecimal(validatedData.strikePrice),
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        optionType: validatedData.optionType || null,
        premium: formatDecimal(validatedData.premium),
        entryDate: new Date(validatedData.entryDate),
        exitDate: validatedData.exitDate ? new Date(validatedData.exitDate) : null,
        profitLoss: formatDecimal(validatedData.profitLoss),
        notes: validatedData.notes || null,
        sector: validatedData.sector || null,
        strategy: validatedData.strategy || null,
        setupImageUrl: validatedData.setupImageUrl || null,
        preTradeEmotion: validatedData.preTradeEmotion || null,
        postTradeEmotion: validatedData.postTradeEmotion || null,
        tradeConfidence: validatedData.tradeConfidence || null,
        tradeRating: validatedData.tradeRating || null,
        lessons: validatedData.lessons || null,
        riskRewardRatio: formatDecimal(validatedData.riskRewardRatio),
        stopLoss: formatDecimal(validatedData.stopLoss),
        targetPrice: formatDecimal(validatedData.targetPrice),
        timeFrame: validatedData.timeFrame || null,
        marketCondition: validatedData.marketCondition || null,
      },
    });

    // Log the action for audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_TRADE',
        resource: 'Trade',
        resourceId: trade.id.toString(),
        metadata: JSON.stringify({ 
          symbol: trade.symbol,
          type: trade.type,
          entryPrice: trade.entryPrice 
        })
      }
    });

    revalidatePath('/trades');
    revalidatePath('/calendar');
    revalidatePath('/analytics');
    revalidatePath('/heatmaps');
    revalidatePath('/');
    
    return trade;
  } catch (error) {
    console.error('Error creating trade:', error);
    throw new Error('Failed to create trade');
  }
}

export async function updateTrade(id: number, data: TradeFormData) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Verify the trade belongs to the user
    const existingTrade = await prisma.trade.findFirst({
      where: { 
        id, 
        userId: user.id 
      },
      select: { id: true }
    });

    if (!existingTrade) {
      throw new Error('Trade not found or access denied');
    }

    const validatedData = tradeSchema.parse(data);
    
    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        symbol: validatedData.symbol,
        type: validatedData.type,
        instrumentType: validatedData.instrumentType,
        entryPrice: formatDecimal(validatedData.entryPrice)!,
        exitPrice: formatDecimal(validatedData.exitPrice),
        quantity: validatedData.quantity,
        strikePrice: formatDecimal(validatedData.strikePrice),
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        optionType: validatedData.optionType || null,
        premium: formatDecimal(validatedData.premium),
        entryDate: new Date(validatedData.entryDate),
        exitDate: validatedData.exitDate ? new Date(validatedData.exitDate) : null,
        profitLoss: formatDecimal(validatedData.profitLoss),
        notes: validatedData.notes || null,
        sector: validatedData.sector || null,
        strategy: validatedData.strategy || null,
        setupImageUrl: validatedData.setupImageUrl || null,
        preTradeEmotion: validatedData.preTradeEmotion || null,
        postTradeEmotion: validatedData.postTradeEmotion || null,
        tradeConfidence: validatedData.tradeConfidence || null,
        tradeRating: validatedData.tradeRating || null,
        lessons: validatedData.lessons || null,
        riskRewardRatio: formatDecimal(validatedData.riskRewardRatio),
        stopLoss: formatDecimal(validatedData.stopLoss),
        targetPrice: formatDecimal(validatedData.targetPrice),
        timeFrame: validatedData.timeFrame || null,
        marketCondition: validatedData.marketCondition || null,
      },
    });

    // Log the action for audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_TRADE',
        resource: 'Trade',
        resourceId: id.toString(),
        metadata: JSON.stringify({ 
          updatedFields: Object.keys(data) 
        })
      }
    });

    revalidatePath('/trades');
    revalidatePath('/calendar');
    revalidatePath('/analytics');
    revalidatePath('/heatmaps');
    revalidatePath('/');
    
    return updatedTrade;
  } catch (error) {
    console.error('Error updating trade:', error);
    throw new Error('Failed to update trade');
  }
}

export async function deleteTrade(id: number) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Verify the trade belongs to the user
    const existingTrade = await prisma.trade.findFirst({
      where: { 
        id, 
        userId: user.id 
      },
      select: { id: true, symbol: true }
    });

    if (!existingTrade) {
      throw new Error('Trade not found or access denied');
    }

    await prisma.trade.delete({
      where: { id },
    });

    // Log the action for audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_TRADE',
        resource: 'Trade',
        resourceId: id.toString(),
        metadata: JSON.stringify({ 
          symbol: existingTrade.symbol 
        })
      }
    });

    revalidatePath('/trades');
    return { success: true };
  } catch (error) {
    console.error('Error deleting trade:', error);
    throw new Error('Failed to delete trade');
  }
} 