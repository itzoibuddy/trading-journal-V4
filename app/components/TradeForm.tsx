'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TradeFormData, createTrade, updateTrade } from '../actions/trade';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  type: z.enum(['LONG', 'SHORT']),
  instrumentType: z.enum(['STOCK', 'FUTURES', 'OPTIONS']).default('STOCK'),
  entryPrice: z.coerce.number().positive('Entry price must be positive'),
  exitPrice: z.coerce.number().optional().nullable(),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  strikePrice: z.coerce.number().positive('Strike price must be positive').optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  optionType: z.enum(['CALL', 'PUT']).optional().nullable(),
  premium: z.coerce.number().optional().nullable(),
  entryDate: z.string(),
  exitDate: z.string().optional().nullable(),
  profitLoss: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  strategy: z.string().optional().nullable(),
  setupImageUrl: z.string().optional().nullable(),
  preTradeEmotion: z.string().optional().nullable(),
  postTradeEmotion: z.string().optional().nullable(),
  tradeConfidence: z.coerce.number().min(1).max(10).optional().nullable(),
  tradeRating: z.coerce.number().min(1).max(10).optional().nullable(),
  lessons: z.string().optional().nullable(),
  riskRewardRatio: z.coerce.number().positive().optional().nullable(),
  stopLoss: z.coerce.number().optional().nullable(),
  targetPrice: z.coerce.number().optional().nullable(),
  timeFrame: z.string().optional().nullable(),
  marketCondition: z.string().optional().nullable(),
});

type TradeFormProps = {
  initialData?: TradeFormData & { id?: number };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function TradeForm({ initialData, onSuccess, onCancel }: TradeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData?.id;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: initialData || {
      type: 'LONG',
      instrumentType: 'STOCK',
      entryDate: new Date().toISOString().split('T')[0],
    },
  });

  const instrumentType = watch('instrumentType');

  const onSubmit = async (data: TradeFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && initialData.id) {
        await updateTrade(initialData.id, data);
      } else {
        await createTrade(data);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error submitting trade:', err);
      setError('Failed to save trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Trade Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Symbol</label>
          <input
            type="text"
            {...register('symbol')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.symbol && <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            {...register('type')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Instrument Type</label>
          <select
            {...register('instrumentType')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="STOCK">Stock</option>
            <option value="FUTURES">Futures</option>
            <option value="OPTIONS">Options</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Entry Price</label>
          <input
            type="number"
            step="0.01"
            {...register('entryPrice')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.entryPrice && <p className="mt-1 text-sm text-red-600">{errors.entryPrice.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Exit Price</label>
          <input
            type="number"
            step="0.01"
            {...register('exitPrice')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            step="0.01"
            {...register('quantity')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Entry Date</label>
          <input
            type="date"
            {...register('entryDate')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.entryDate && <p className="mt-1 text-sm text-red-600">{errors.entryDate.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Exit Date</label>
          <input
            type="date"
            {...register('exitDate')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">P&L</label>
          <input
            type="number"
            step="0.01"
            {...register('profitLoss')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Options/Futures specific fields */}
        {instrumentType !== 'STOCK' && (
          <>
            {instrumentType === 'OPTIONS' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Strike Price</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('strikePrice')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Option Type</label>
                  <select
                    {...register('optionType')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    <option value="CALL">Call</option>
                    <option value="PUT">Put</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Premium</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('premium')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
              <input
                type="date"
                {...register('expiryDate')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        {/* Additional fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Sector</label>
          <input
            type="text"
            {...register('sector')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Strategy</label>
          <input
            type="text"
            {...register('strategy')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Time Frame</label>
          <input
            type="text"
            placeholder="e.g., 5m, 1h, Daily"
            {...register('timeFrame')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Market Condition</label>
          <input
            type="text"
            placeholder="e.g., Bullish, Bearish, Sideways"
            {...register('marketCondition')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Risk-Reward Ratio</label>
          <input
            type="number"
            step="0.01"
            {...register('riskRewardRatio')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stop Loss</label>
          <input
            type="number"
            step="0.01"
            {...register('stopLoss')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Target Price</label>
          <input
            type="number"
            step="0.01"
            {...register('targetPrice')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Trade Confidence (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            {...register('tradeConfidence')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Trade Rating (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            {...register('tradeRating')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Pre-Trade Emotion</label>
          <input
            type="text"
            {...register('preTradeEmotion')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Post-Trade Emotion</label>
          <input
            type="text"
            {...register('postTradeEmotion')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Setup Image URL</label>
          <input
            type="text"
            {...register('setupImageUrl')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700">Lessons Learned</label>
          <textarea
            rows={3}
            {...register('lessons')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            rows={3}
            {...register('notes')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Trade' : 'Add Trade'}
        </button>
      </div>
    </form>
  );
}
