'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { createTrade, updateTrade, TradeFormData } from '../actions/trade';
import {
  InstrumentType,
  TradeType,
  OptionType,
  LOT_SIZES,
  TIME_FRAMES,
  MARKET_CONDITIONS,
  PRE_TRADE_EMOTIONS,
  POST_TRADE_EMOTIONS,
  DEFAULT_TRADE_FORM_VALUES
} from '../config/constants';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  type: z.enum(['LONG', 'SHORT']),
  instrumentType: z.enum(['STOCK', 'FUTURES', 'OPTIONS']).default('STOCK'),
  entryPrice: z.number().positive('Entry price must be positive'),
  exitPrice: z.number().optional().nullable(),
  quantity: z.number().positive('Quantity must be positive'),
  strikePrice: z.number().positive('Strike price must be positive').optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  optionType: z.enum(['CALL', 'PUT']).optional().nullable(),
  entryDate: z.string(),
  exitDate: z.string().optional().nullable(),
  profitLoss: z.number().optional().nullable(),
  notes: z.string().optional(),
  sector: z.string().optional().nullable(),
  strategy: z.string().optional(),
  timeFrame: z.string().optional(),
  marketCondition: z.string().optional(),
  stopLoss: z.number().optional(),
  targetPrice: z.number().optional(),
  riskRewardRatio: z.number().optional(),
  preTradeEmotion: z.string().optional(),
  postTradeEmotion: z.string().optional(),
  tradeConfidence: z.number().optional(),
  tradeRating: z.number().optional(),
  lessons: z.string().optional(),
  setupImageUrl: z.string().optional(),
});

// Helper function to convert lots to quantity based on symbol
const convertLotsToQuantity = (lots: number, symbol: string): number => {
  const lotSize = LOT_SIZES[symbol] || LOT_SIZES.DEFAULT;
  return lots * lotSize;
};

// Helper function to calculate lot size for a symbol
const getLotSize = (symbol: string): number => {
  return LOT_SIZES[symbol] || LOT_SIZES.DEFAULT;
};

interface TradeFormProps {
  initialData?: TradeFormData & { id?: number };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TradeForm({ initialData, onSuccess, onCancel }: TradeFormProps) {
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<string>(initialData?.instrumentType || 'STOCK');
  const [inputAsLots, setInputAsLots] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: DEFAULT_TRADE_FORM_VALUES
  });

  // Format number to 2 decimal places
  const formatNumber = (value: number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    return parseFloat(Number(value).toFixed(2));
  };

  // Add the watch variables for calculations
  const watchType = watch('type');
  const watchInstrumentType = watch('instrumentType');
  const watchEntryPrice = watch('entryPrice');
  const watchExitPrice = watch('exitPrice');
  const watchQuantity = watch('quantity');
  const watchOptionType = watch('optionType');
  const watchStrikePrice = watch('strikePrice');
  const watchStopLoss = watch('stopLoss');
  const watchTargetPrice = watch('targetPrice');

  // Auto-calculate profit/loss
  useEffect(() => {
    if (watchEntryPrice && watchExitPrice && watchQuantity) {
      let profitLoss = 0;
      
      if (watchType === TradeType.LONG) {
        profitLoss = (watchExitPrice - watchEntryPrice) * watchQuantity;
      } else { // SHORT
        profitLoss = (watchEntryPrice - watchExitPrice) * watchQuantity;
      }
      
      setValue('profitLoss', formatNumber(profitLoss));
    }
  }, [watchType, watchEntryPrice, watchExitPrice, watchQuantity, setValue]);

  // Auto-calculate risk-reward ratio
  useEffect(() => {
    if (watchEntryPrice && watchStopLoss && watchTargetPrice) {
      let risk = 0;
      let reward = 0;
      let riskRewardRatio = 0;
      
      if (watchType === TradeType.LONG) {
        risk = Math.abs(watchEntryPrice - watchStopLoss);
        reward = Math.abs(watchTargetPrice - watchEntryPrice);
      } else { // SHORT
        risk = Math.abs(watchStopLoss - watchEntryPrice);
        reward = Math.abs(watchEntryPrice - watchTargetPrice);
      }
      
      if (risk > 0) {
        riskRewardRatio = parseFloat((reward / risk).toFixed(2));
        setValue('riskRewardRatio', riskRewardRatio);
      }
    }
  }, [watchType, watchEntryPrice, watchStopLoss, watchTargetPrice, setValue]);

  // Set form values when editing
  useEffect(() => {
    if (initialData && initialData.id) {
      const trade = initialData;
      
      // Check if this is likely a lot-based quantity for NIFTY or SENSEX
      const symbol = trade.symbol.toUpperCase();
      const lotSize = getLotSize(symbol);
      const isLotBased = (symbol === 'NIFTY' || symbol === 'SENSEX') && 
                          trade.quantity && (trade.quantity % lotSize === 0);
      
      // Set the inputAsLots state based on the trade
      setInputAsLots(Boolean(isLotBased));
      
      // Format dates properly for the datetime-local inputs
      const formatDateForInput = (dateValue: string | null | undefined) => {
        if (!dateValue) return '';
        // Make sure we have a proper ISO string (YYYY-MM-DDTHH:MM)
        return new Date(dateValue).toISOString().slice(0, 16);
      };

      // Set form values - basic fields
      setValue('symbol', trade.symbol);
      setValue('type', trade.type);
      setValue('instrumentType', trade.instrumentType || InstrumentType.STOCK);
      setValue('entryPrice', trade.entryPrice);
      setValue('exitPrice', trade.exitPrice || null);
      setValue('quantity', trade.quantity);
      setValue('entryDate', formatDateForInput(trade.entryDate));
      setValue('exitDate', formatDateForInput(trade.exitDate));
      setValue('profitLoss', trade.profitLoss || null);
      setValue('notes', trade.notes || '');
      setValue('sector', trade.sector || '');
      
      // Set options/futures specific fields
      if (trade.instrumentType === InstrumentType.OPTIONS) {
        setValue('strikePrice', trade.strikePrice || null);
        setValue('expiryDate', formatDateForInput(trade.expiryDate));
        setValue('optionType', trade.optionType || null);
      } else if (trade.instrumentType === InstrumentType.FUTURES) {
        setValue('expiryDate', formatDateForInput(trade.expiryDate));
      }
      
      // Set advanced trade journal fields
      setValue('strategy', trade.strategy || '');
      setValue('timeFrame', trade.timeFrame || '');
      setValue('marketCondition', trade.marketCondition || '');
      setValue('stopLoss', trade.stopLoss || null);
      setValue('targetPrice', trade.targetPrice || null);
      setValue('riskRewardRatio', trade.riskRewardRatio || null);
      setValue('preTradeEmotion', trade.preTradeEmotion || '');
      setValue('postTradeEmotion', trade.postTradeEmotion || '');
      setValue('tradeConfidence', trade.tradeConfidence || null);
      setValue('tradeRating', trade.tradeRating || null);
      setValue('lessons', trade.lessons || '');
      setValue('setupImageUrl', trade.setupImageUrl || '');
      
      setSelectedInstrumentType(trade.instrumentType || InstrumentType.STOCK);
    }
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: TradeFormData) => {
    // Sanitize text inputs to prevent XSS attacks
    const sanitizedData = {
      ...data,
      symbol: DOMPurify.sanitize(data.symbol),
      notes: data.notes ? DOMPurify.sanitize(data.notes) : data.notes,
      sector: data.sector ? DOMPurify.sanitize(data.sector) : data.sector,
      strategy: data.strategy ? DOMPurify.sanitize(data.strategy) : data.strategy,
      lessons: data.lessons ? DOMPurify.sanitize(data.lessons) : data.lessons,
      setupImageUrl: data.setupImageUrl ? DOMPurify.sanitize(data.setupImageUrl) : data.setupImageUrl,
      // Ensure dates are properly formatted as strings
      entryDate: data.entryDate,
      exitDate: data.exitDate,
      expiryDate: data.expiryDate
    };
    
    try {
      if (initialData && initialData.id) {
        // Update existing trade
        await updateTrade(initialData.id, sanitizedData);
      } else {
        // Create new trade
        await createTrade(sanitizedData);
      }
      onSuccess();
      reset();
    } catch (error) {
      console.error('Error saving trade:', error);
    }
  };

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{initialData?.id ? 'Edit Trade' : 'Add New Trade'}</h3>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Form fields here */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
          >
            {isSubmitting ? 'Saving...' : initialData?.id ? 'Update Trade' : 'Add Trade'}
          </button>
        </div>
      </form>
    </div>
  );
} 