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
  initialData?: (TradeFormData & { id: number }) | undefined;
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

  // Format number to always display 2 decimal places
  const formatNumber = (value: number | null | undefined): number => {
    if (value === null || value === undefined) return 0.00;
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

      // Format decimal values to always have 2 decimal places
      const formatDecimal = (value: number | null | undefined): number => {
        if (value === null || value === undefined) return 0;
        return parseFloat(value.toFixed(2));
      };

      // Set form values - basic fields
      setValue('symbol', trade.symbol);
      setValue('type', trade.type);
      setValue('instrumentType', trade.instrumentType || InstrumentType.STOCK);
      setValue('entryPrice', formatDecimal(trade.entryPrice));
      setValue('exitPrice', trade.exitPrice ? formatDecimal(trade.exitPrice) : null);
      setValue('quantity', trade.quantity);
      setValue('entryDate', formatDateForInput(trade.entryDate));
      setValue('exitDate', formatDateForInput(trade.exitDate));
      setValue('profitLoss', trade.profitLoss ? formatDecimal(trade.profitLoss) : null);
      setValue('notes', trade.notes || '');
      setValue('sector', trade.sector || '');
      
      // Set options/futures specific fields
      if (trade.instrumentType === InstrumentType.OPTIONS) {
        setValue('strikePrice', trade.strikePrice ? formatDecimal(trade.strikePrice) : null);
        setValue('expiryDate', formatDateForInput(trade.expiryDate));
        setValue('optionType', trade.optionType || null);
      } else if (trade.instrumentType === InstrumentType.FUTURES) {
        setValue('expiryDate', formatDateForInput(trade.expiryDate));
      }
      
      // Set advanced trade journal fields
      setValue('strategy', trade.strategy || '');
      setValue('timeFrame', trade.timeFrame || '');
      setValue('marketCondition', trade.marketCondition || '');
      setValue('stopLoss', trade.stopLoss ? formatDecimal(trade.stopLoss) : null);
      setValue('targetPrice', trade.targetPrice ? formatDecimal(trade.targetPrice) : null);
      setValue('riskRewardRatio', trade.riskRewardRatio ? formatDecimal(trade.riskRewardRatio) : null);
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
      console.log("Form submission data:", JSON.stringify(sanitizedData, null, 2));
      console.log("Initial data:", initialData);
      
      if (initialData && initialData.id) {
        // Update existing trade
        console.log("Updating trade with ID:", initialData.id);
        await updateTrade(initialData.id, sanitizedData);
        console.log("Trade updated successfully");
      } else {
        // Create new trade
        console.log("Creating new trade");
        await createTrade(sanitizedData);
        console.log("Trade created successfully");
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
        {/* Basic Trade Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Symbol */}
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700">Symbol *</label>
            <input
              type="text"
              id="symbol"
              {...register('symbol')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., NIFTY, RELIANCE"
            />
            {errors.symbol && <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>}
          </div>

          {/* Trade Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Trade Type *</label>
            <select
              id="type"
              {...register('type')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
          </div>

          {/* Instrument Type */}
          <div>
            <label htmlFor="instrumentType" className="block text-sm font-medium text-gray-700">Instrument Type *</label>
            <select
              id="instrumentType"
              {...register('instrumentType')}
              onChange={(e) => setSelectedInstrumentType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="STOCK">STOCK</option>
              <option value="FUTURES">FUTURES</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
            {errors.instrumentType && <p className="mt-1 text-sm text-red-600">{errors.instrumentType.message}</p>}
          </div>

          {/* Entry Price */}
          <div>
            <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700">Entry Price *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              id="entryPrice"
              {...register('entryPrice', { 
                valueAsNumber: true,
                onChange: (e) => {
                  // Force 2 decimal places as user types
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    const formattedValue = parseFloat(value.toFixed(2));
                    if (formattedValue !== value) {
                      setValue('entryPrice', formattedValue);
                    }
                  }
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
              onBlur={(e) => {
                // Format on blur to ensure 2 decimal places
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  e.target.value = value.toFixed(2);
                  setValue('entryPrice', parseFloat(value.toFixed(2)));
                }
              }}
            />
            {errors.entryPrice && <p className="mt-1 text-sm text-red-600">{errors.entryPrice.message}</p>}
          </div>

          {/* Exit Price */}
          <div>
            <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700">Exit Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              id="exitPrice"
              {...register('exitPrice', { 
                valueAsNumber: true,
                onChange: (e) => {
                  // Force 2 decimal places as user types
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    const formattedValue = parseFloat(value.toFixed(2));
                    if (formattedValue !== value) {
                      setValue('exitPrice', formattedValue);
                    }
                  }
                } 
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
              onBlur={(e) => {
                // Format on blur to ensure 2 decimal places
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  e.target.value = value.toFixed(2);
                  setValue('exitPrice', parseFloat(value.toFixed(2)));
                }
              }}
            />
            {errors.exitPrice && <p className="mt-1 text-sm text-red-600">{errors.exitPrice.message}</p>}
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity *</label>
            <input
              type="number"
              step="1"
              id="quantity"
              {...register('quantity', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0"
            />
            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
          </div>

          {/* Entry Date */}
          <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700">Entry Date & Time *</label>
            <input
              type="datetime-local"
              id="entryDate"
              {...register('entryDate')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.entryDate && <p className="mt-1 text-sm text-red-600">{errors.entryDate.message}</p>}
          </div>

          {/* Exit Date */}
          <div>
            <label htmlFor="exitDate" className="block text-sm font-medium text-gray-700">Exit Date & Time</label>
            <input
              type="datetime-local"
              id="exitDate"
              {...register('exitDate')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.exitDate && <p className="mt-1 text-sm text-red-600">{errors.exitDate.message}</p>}
          </div>

          {/* Sector */}
          <div>
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700">Sector</label>
            <input
              type="text"
              id="sector"
              {...register('sector')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Technology, Banking"
            />
            {errors.sector && <p className="mt-1 text-sm text-red-600">{errors.sector.message}</p>}
          </div>

          {/* Options/Futures specific fields */}
          {selectedInstrumentType === 'OPTIONS' && (
            <>
              {/* Strike Price */}
              <div>
                <label htmlFor="strikePrice" className="block text-sm font-medium text-gray-700">Strike Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="strikePrice"
                  {...register('strikePrice', { 
                    valueAsNumber: true,
                    onChange: (e) => {
                      // Force 2 decimal places as user types
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        const formattedValue = parseFloat(value.toFixed(2));
                        if (formattedValue !== value) {
                          setValue('strikePrice', formattedValue);
                        }
                      }
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                  onBlur={(e) => {
                    // Format on blur to ensure 2 decimal places
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      e.target.value = value.toFixed(2);
                      setValue('strikePrice', parseFloat(value.toFixed(2)));
                    }
                  }}
                />
                {errors.strikePrice && <p className="mt-1 text-sm text-red-600">{errors.strikePrice.message}</p>}
              </div>

              {/* Option Type */}
              <div>
                <label htmlFor="optionType" className="block text-sm font-medium text-gray-700">Option Type *</label>
                <select
                  id="optionType"
                  {...register('optionType')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="CALL">CALL</option>
                  <option value="PUT">PUT</option>
                </select>
                {errors.optionType && <p className="mt-1 text-sm text-red-600">{errors.optionType.message}</p>}
              </div>

              {/* Expiry Date */}
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date *</label>
                <input
                  type="date"
                  id="expiryDate"
                  {...register('expiryDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>}
              </div>
            </>
          )}

          {selectedInstrumentType === 'FUTURES' && (
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date *</label>
              <input
                type="date"
                id="expiryDate"
                {...register('expiryDate')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>}
            </div>
          )}
        </div>

        {/* Advanced Trade Analysis */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-700 mb-4">Trade Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strategy */}
            <div>
              <label htmlFor="strategy" className="block text-sm font-medium text-gray-700">Strategy</label>
              <input
                type="text"
                id="strategy"
                {...register('strategy')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., Breakout, Reversal"
              />
            </div>

            {/* Time Frame */}
            <div>
              <label htmlFor="timeFrame" className="block text-sm font-medium text-gray-700">Time Frame</label>
              <select
                id="timeFrame"
                {...register('timeFrame')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Time Frame</option>
                {TIME_FRAMES.map(frame => (
                  <option key={frame.value} value={frame.value}>{frame.label}</option>
                ))}
              </select>
            </div>

            {/* Market Condition */}
            <div>
              <label htmlFor="marketCondition" className="block text-sm font-medium text-gray-700">Market Condition</label>
              <select
                id="marketCondition"
                {...register('marketCondition')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Market Condition</option>
                {MARKET_CONDITIONS.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>

            {/* Stop Loss */}
            <div>
              <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-700">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="stopLoss"
                {...register('stopLoss', { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    // Force 2 decimal places as user types
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      const formattedValue = parseFloat(value.toFixed(2));
                      if (formattedValue !== value) {
                        setValue('stopLoss', formattedValue);
                      }
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0.00"
                onBlur={(e) => {
                  // Format on blur to ensure 2 decimal places
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    e.target.value = value.toFixed(2);
                    setValue('stopLoss', parseFloat(value.toFixed(2)));
                  }
                }}
              />
            </div>

            {/* Target Price */}
            <div>
              <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-700">Target Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="targetPrice"
                {...register('targetPrice', { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    // Force 2 decimal places as user types
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      const formattedValue = parseFloat(value.toFixed(2));
                      if (formattedValue !== value) {
                        setValue('targetPrice', formattedValue);
                      }
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0.00"
                onBlur={(e) => {
                  // Format on blur to ensure 2 decimal places
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    e.target.value = value.toFixed(2);
                    setValue('targetPrice', parseFloat(value.toFixed(2)));
                  }
                }}
              />
            </div>

            {/* Risk-Reward Ratio */}
            <div>
              <label htmlFor="riskRewardRatio" className="block text-sm font-medium text-gray-700">Risk-Reward Ratio</label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="riskRewardRatio"
                {...register('riskRewardRatio', { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    // Force 2 decimal places as user types
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      const formattedValue = parseFloat(value.toFixed(2));
                      if (formattedValue !== value) {
                        setValue('riskRewardRatio', formattedValue);
                      }
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0.00"
                readOnly
              />
            </div>

            {/* Pre-Trade Emotion */}
            <div>
              <label htmlFor="preTradeEmotion" className="block text-sm font-medium text-gray-700">Pre-Trade Emotion</label>
              <select
                id="preTradeEmotion"
                {...register('preTradeEmotion')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Emotion</option>
                {PRE_TRADE_EMOTIONS.map(emotion => (
                  <option key={emotion.value} value={emotion.value}>{emotion.label}</option>
                ))}
              </select>
            </div>

            {/* Post-Trade Emotion */}
            <div>
              <label htmlFor="postTradeEmotion" className="block text-sm font-medium text-gray-700">Post-Trade Emotion</label>
              <select
                id="postTradeEmotion"
                {...register('postTradeEmotion')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Emotion</option>
                {POST_TRADE_EMOTIONS.map(emotion => (
                  <option key={emotion.value} value={emotion.value}>{emotion.label}</option>
                ))}
              </select>
            </div>

            {/* Trade Confidence */}
            <div>
              <label htmlFor="tradeConfidence" className="block text-sm font-medium text-gray-700">Trade Confidence (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                id="tradeConfidence"
                {...register('tradeConfidence', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="1-10"
              />
            </div>

            {/* Trade Rating */}
            <div>
              <label htmlFor="tradeRating" className="block text-sm font-medium text-gray-700">Trade Rating (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                id="tradeRating"
                {...register('tradeRating', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="1-10"
              />
            </div>

            {/* Setup Image URL */}
            <div>
              <label htmlFor="setupImageUrl" className="block text-sm font-medium text-gray-700">Setup Image URL</label>
              <input
                type="url"
                id="setupImageUrl"
                {...register('setupImageUrl')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Notes and Lessons */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-700 mb-4">Notes & Lessons</h4>
          <div className="grid grid-cols-1 gap-6">
            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Trade Notes</label>
              <textarea
                id="notes"
                rows={3}
                {...register('notes')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Any notes about the trade..."
              ></textarea>
            </div>

            {/* Lessons */}
            <div>
              <label htmlFor="lessons" className="block text-sm font-medium text-gray-700">Lessons Learned</label>
              <textarea
                id="lessons"
                rows={3}
                {...register('lessons')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="What did you learn from this trade?"
              ></textarea>
            </div>
          </div>
        </div>

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