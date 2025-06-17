'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TradeFormData } from '../types/Trade';
import { createTrade, updateTrade } from '../actions/trade';
import DOMPurify from 'dompurify';
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
  if (symbol === 'NIFTY') return lots * 75;
  if (symbol === 'SENSEX') return lots * 20;
  return lots; // Default case for other symbols
};

// Helper function to calculate lot size for a symbol
const getLotSize = (symbol: string): number => {
  if (symbol === 'NIFTY') return 75;
  if (symbol === 'SENSEX') return 20;
  return 1; // Default case for other symbols
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
    defaultValues: {
      instrumentType: 'STOCK',
      type: 'LONG',
    }
  });

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
      
      if (watchType === 'LONG') {
        profitLoss = (watchExitPrice - watchEntryPrice) * watchQuantity;
      } else { // SHORT
        profitLoss = (watchEntryPrice - watchExitPrice) * watchQuantity;
      }
      
      setValue('profitLoss', profitLoss);
    }
  }, [watchType, watchEntryPrice, watchExitPrice, watchQuantity, setValue]);

  // Auto-calculate risk-reward ratio
  useEffect(() => {
    if (watchEntryPrice && watchStopLoss && watchTargetPrice) {
      let risk = 0;
      let reward = 0;
      let riskRewardRatio = 0;
      
      if (watchType === 'LONG') {
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
      const formatDateForInput = (dateValue: string | Date | null | undefined) => {
        if (!dateValue) return '';
        // Make sure we have a proper ISO string (YYYY-MM-DDTHH:MM)
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        return date.toISOString().slice(0, 16);
      };

      // Set form values - basic fields
      setValue('symbol', trade.symbol);
      setValue('type', trade.type);
      setValue('instrumentType', trade.instrumentType || 'STOCK');
      setValue('entryPrice', trade.entryPrice);
      setValue('exitPrice', trade.exitPrice || null);
      setValue('quantity', trade.quantity);
      setValue('entryDate', formatDateForInput(trade.entryDate));
      setValue('exitDate', formatDateForInput(trade.exitDate));
      setValue('profitLoss', trade.profitLoss || null);
      setValue('notes', trade.notes || '');
      setValue('sector', trade.sector || '');
      
      // Set options/futures specific fields
      if (trade.instrumentType === 'OPTIONS') {
        setValue('strikePrice', trade.strikePrice || null);
        setValue('expiryDate', formatDateForInput(trade.expiryDate));
        setValue('optionType', trade.optionType || null);
      } else if (trade.instrumentType === 'FUTURES') {
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
      
      setSelectedInstrumentType(trade.instrumentType || 'STOCK');
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
      entryDate: typeof data.entryDate === 'string' ? data.entryDate : new Date(data.entryDate).toISOString(),
      exitDate: data.exitDate ? (typeof data.exitDate === 'string' ? data.exitDate : new Date(data.exitDate).toISOString()) : null,
      expiryDate: data.expiryDate ? (typeof data.expiryDate === 'string' ? data.expiryDate : new Date(data.expiryDate).toISOString()) : null,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Instrument Type */}
          <div>
            <label htmlFor="instrumentType" className="block text-sm font-medium text-gray-700 mb-1">
              Instrument Type
            </label>
            <select
              id="instrumentType"
              {...register('instrumentType')}
              onChange={(e) => {
                setSelectedInstrumentType(e.target.value);
                // Set default option type when switching to OPTIONS
                if (e.target.value === 'OPTIONS') {
                  setValue('optionType', 'CALL');
                }
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="STOCK">Stock</option>
              <option value="FUTURES">Futures</option>
              <option value="OPTIONS">Options</option>
            </select>
            {errors.instrumentType && <p className="mt-1 text-sm text-red-600">{errors.instrumentType.message}</p>}
          </div>

          {/* Symbol */}
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input
              type="text"
              id="symbol"
              {...register('symbol')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g. RELIANCE"
            />
            {errors.symbol && <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>}
          </div>

          {/* Type (LONG/SHORT) */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              {...register('type')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
          </div>

          {/* Entry Price */}
          <div>
            <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Entry Price (₹)
            </label>
            <input
              type="number"
              id="entryPrice"
              step="0.01"
              {...register('entryPrice', { valueAsNumber: true })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.entryPrice && <p className="mt-1 text-sm text-red-600">{errors.entryPrice.message}</p>}
          </div>

          {/* Exit Price */}
          <div>
            <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Exit Price (₹)
            </label>
            <input
              type="number"
              id="exitPrice"
              step="0.01"
              {...register('exitPrice', { valueAsNumber: true })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.exitPrice && <p className="mt-1 text-sm text-red-600">{errors.exitPrice.message}</p>}
          </div>

          {/* Quantity */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity
                {watch('symbol') && (watch('symbol').toUpperCase() === 'NIFTY' || watch('symbol').toUpperCase() === 'SENSEX') && (
                  <span className="text-xs text-gray-500 ml-1">
                    (1 lot = {watch('symbol').toUpperCase() === 'NIFTY' ? '75' : '20'} qty)
                  </span>
                )}
              </label>
              {watch('symbol') && (watch('symbol').toUpperCase() === 'NIFTY' || watch('symbol').toUpperCase() === 'SENSEX') && (
                <div className="flex items-center">
                  <input
                    id="inputAsLots"
                    type="checkbox"
                    checked={inputAsLots}
                    onChange={(e) => setInputAsLots(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="inputAsLots" className="ml-2 text-xs text-gray-700">
                    Input as lots
                  </label>
                </div>
              )}
            </div>
            <input
              type="number"
              id="quantity"
              {...register('quantity', { valueAsNumber: true })}
              onChange={(e) => {
                if (inputAsLots && watch('symbol')) {
                  const symbol = watch('symbol').toUpperCase();
                  if (symbol === 'NIFTY' || symbol === 'SENSEX') {
                    const lots = parseFloat(e.target.value);
                    if (!isNaN(lots)) {
                      const actualQty = convertLotsToQuantity(lots, symbol);
                      setValue('quantity', actualQty);
                    }
                  }
                }
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={inputAsLots ? "Enter lots" : "Enter quantity"}
            />
            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
          </div>

          {/* Sector */}
          <div>
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
              Sector
            </label>
            <input
              type="text"
              id="sector"
              {...register('sector')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g. Technology, Banking"
            />
          </div>

          {/* Entry Date */}
          <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Entry Date
            </label>
            <input
              type="datetime-local"
              id="entryDate"
              {...register('entryDate')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.entryDate && <p className="mt-1 text-sm text-red-600">{errors.entryDate.message}</p>}
          </div>

          {/* Exit Date */}
          <div>
            <label htmlFor="exitDate" className="block text-sm font-medium text-gray-700 mb-1">
              Exit Date
            </label>
            <input
              type="datetime-local"
              id="exitDate"
              {...register('exitDate')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.exitDate && <p className="mt-1 text-sm text-red-600">{errors.exitDate.message}</p>}
          </div>

          {/* Conditional fields for OPTIONS */}
          {selectedInstrumentType === 'OPTIONS' && (
            <>
              {/* Strike Price */}
              <div>
                <label htmlFor="strikePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Strike Price (₹)
                </label>
                <input
                  type="number"
                  id="strikePrice"
                  step="0.01"
                  {...register('strikePrice', { valueAsNumber: true })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.strikePrice && <p className="mt-1 text-sm text-red-600">{errors.strikePrice.message}</p>}
              </div>

              {/* Option Type */}
              <div>
                <label htmlFor="optionType" className="block text-sm font-medium text-gray-700 mb-1">
                  Option Type <span className="text-xs text-gray-500">(Required)</span>
                </label>
                <select
                  id="optionType"
                  {...register('optionType')}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  defaultValue="CALL"
                >
                  <option value="CALL">Call</option>
                  <option value="PUT">Put</option>
                </select>
                {errors.optionType && <p className="mt-1 text-sm text-red-600">{errors.optionType.message}</p>}
              </div>
            </>
          )}

          {/* Conditional fields for FUTURES and OPTIONS */}
          {(selectedInstrumentType === 'FUTURES' || selectedInstrumentType === 'OPTIONS') && (
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                id="expiryDate"
                {...register('expiryDate')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>}
            </div>
          )}

          {/* Profit/Loss */}
          <div>
            <label htmlFor="profitLoss" className="block text-sm font-medium text-gray-700 mb-1">
              Profit/Loss (₹) <span className="text-xs text-gray-500">(Auto-calculated)</span>
            </label>
            <input
              type="number"
              id="profitLoss"
              step="0.01"
              {...register('profitLoss', { valueAsNumber: true })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.profitLoss && <p className="mt-1 text-sm text-red-600">{errors.profitLoss.message}</p>}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register('notes')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Add your trade notes here..."
          ></textarea>
        </div>

        {/* Enhanced Trade Journal Features */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Advanced Trade Journal</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Strategy */}
            <div>
              <label htmlFor="strategy" className="block text-sm font-medium text-gray-700 mb-1">
                Strategy
              </label>
              <input
                type="text"
                id="strategy"
                {...register('strategy')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. Breakout, Support Bounce"
              />
            </div>
            
            {/* Time Frame */}
            <div>
              <label htmlFor="timeFrame" className="block text-sm font-medium text-gray-700 mb-1">
                Time Frame
              </label>
              <select
                id="timeFrame"
                {...register('timeFrame')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select time frame</option>
                <option value="1m">1 minute</option>
                <option value="2m">2 minutes</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
            
            {/* Market Condition */}
            <div>
              <label htmlFor="marketCondition" className="block text-sm font-medium text-gray-700 mb-1">
                Market Condition
              </label>
              <select
                id="marketCondition"
                {...register('marketCondition')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select market condition</option>
                <option value="Bullish">Bullish</option>
                <option value="Bearish">Bearish</option>
                <option value="Sideways">Sideways</option>
                <option value="Volatile">Volatile</option>
                <option value="Trending">Trending</option>
                <option value="Ranging">Ranging</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Stop Loss */}
            <div>
              <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-700 mb-1">
                Stop Loss (₹)
              </label>
              <input
                type="number"
                id="stopLoss"
                step="0.01"
                {...register('stopLoss', { valueAsNumber: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            {/* Target Price */}
            <div>
              <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Target Price (₹)
              </label>
              <input
                type="number"
                id="targetPrice"
                step="0.01"
                {...register('targetPrice', { valueAsNumber: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            {/* Risk-Reward Ratio */}
            <div>
              <label htmlFor="riskRewardRatio" className="block text-sm font-medium text-gray-700 mb-1">
                Risk-Reward Ratio <span className="text-xs text-gray-500">(Auto-calculated)</span>
              </label>
              <input
                type="number"
                id="riskRewardRatio"
                step="0.01"
                {...register('riskRewardRatio', { valueAsNumber: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. 1.5, 2.0, 3.0"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Pre-Trade Emotion */}
            <div>
              <label htmlFor="preTradeEmotion" className="block text-sm font-medium text-gray-700 mb-1">
                Pre-Trade Emotion
              </label>
              <select
                id="preTradeEmotion"
                {...register('preTradeEmotion')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select emotion</option>
                <option value="Confident">Confident</option>
                <option value="Nervous">Nervous</option>
                <option value="Excited">Excited</option>
                <option value="Fearful">Fearful</option>
                <option value="Calm">Calm</option>
                <option value="Impatient">Impatient</option>
                <option value="Greedy">Greedy</option>
                <option value="Uncertain">Uncertain</option>
              </select>
            </div>
            
            {/* Post-Trade Emotion */}
            <div>
              <label htmlFor="postTradeEmotion" className="block text-sm font-medium text-gray-700 mb-1">
                Post-Trade Emotion
              </label>
              <select
                id="postTradeEmotion"
                {...register('postTradeEmotion')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select emotion</option>
                <option value="Satisfied">Satisfied</option>
                <option value="Disappointed">Disappointed</option>
                <option value="Relieved">Relieved</option>
                <option value="Frustrated">Frustrated</option>
                <option value="Proud">Proud</option>
                <option value="Regretful">Regretful</option>
                <option value="Indifferent">Indifferent</option>
                <option value="Excited">Excited</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Trade Confidence */}
            <div>
              <label htmlFor="tradeConfidence" className="block text-sm font-medium text-gray-700 mb-1">
                Trade Confidence (1-10)
              </label>
              <input
                type="number"
                id="tradeConfidence"
                min="1"
                max="10"
                {...register('tradeConfidence', { valueAsNumber: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            {/* Trade Rating */}
            <div>
              <label htmlFor="tradeRating" className="block text-sm font-medium text-gray-700 mb-1">
                Trade Execution Rating (1-10)
              </label>
              <input
                type="number"
                id="tradeRating"
                min="1"
                max="10"
                {...register('tradeRating', { valueAsNumber: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          {/* Lessons Learned */}
          <div className="mb-4">
            <label htmlFor="lessons" className="block text-sm font-medium text-gray-700 mb-1">
              Lessons Learned
            </label>
            <textarea
              id="lessons"
              rows={2}
              {...register('lessons')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="What did you learn from this trade?"
            ></textarea>
          </div>
          
          {/* Trade Setup Screenshot */}
          <div>
            <label htmlFor="setupImageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Trade Setup Screenshot URL
            </label>
            <input
              type="text"
              id="setupImageUrl"
              {...register('setupImageUrl')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">Enter a URL to your chart screenshot</p>
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
