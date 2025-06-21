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

export async function getTrades() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return [];
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return [];
  }

  return prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { entryDate: 'desc' },
  });
}

export async function getTradesByDate(date: Date) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return [];
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

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
  });
}

// Helper function to format decimal values to 2 decimal places
const formatDecimal = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  return parseFloat(value.toFixed(2));
};

export async function createTrade(data: TradeFormData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  // Get the user from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    throw new Error('User not found');
  }

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
  
  revalidatePath('/trades');
  revalidatePath('/calendar');
  revalidatePath('/analytics');
  revalidatePath('/heatmaps');
  revalidatePath('/');
  
  return trade;
}

export async function updateTrade(id: number, data: TradeFormData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if the trade belongs to the user
  const existingTrade = await prisma.trade.findFirst({
    where: { id, userId: user.id }
  });

  if (!existingTrade) {
    throw new Error('Trade not found or unauthorized');
  }

  const validatedData = tradeSchema.parse(data);
  
  const trade = await prisma.trade.update({
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
  
  revalidatePath('/trades');
  revalidatePath('/calendar');
  revalidatePath('/analytics');
  revalidatePath('/heatmaps');
  revalidatePath('/');
  
  return trade;
}

export async function deleteTrade(id: number) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // First check if the trade exists and belongs to the user
    const existingTrade = await prisma.trade.findFirst({
      where: { id, userId: user.id }
    });
    
    if (!existingTrade) {
      throw new Error(`Trade with ID ${id} not found or unauthorized`);
    }
    
    await prisma.trade.delete({
      where: { id },
    });
    
    // Revalidate relevant paths
    revalidatePath('/trades');
    revalidatePath('/calendar');
    revalidatePath('/analytics');
    revalidatePath('/heatmaps');
    revalidatePath('/');
    
    return { success: true, message: 'Trade deleted successfully' };
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Error deleting trade with ID ${id}:`, error);
    }
    throw error;
  }
} 