'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trade } from '../../types/Trade';

export default function TradeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        const response = await fetch(`/api/trades/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setTrade(data);
        } else {
          console.error('Trade not found');
        }
      } catch (error) {
        console.error('Error fetching trade:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTrade();
    }
  }, [params.id]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 animate-spin">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trade Not Found</h1>
          <p className="text-gray-600 mb-6">The trade you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isProfitable = trade.profitLoss !== null && trade.profitLoss !== undefined && trade.profitLoss > 0;
  const isLoss = trade.profitLoss !== null && trade.profitLoss !== undefined && trade.profitLoss < 0;
  const isOpen = trade.profitLoss === null || trade.profitLoss === undefined || trade.exitDate === null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="text-xl">←</span>
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  📊 Trade Details
                </h1>
                <p className="text-gray-600 mt-2">Complete information about this trade</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isOpen ? 'bg-yellow-100 text-yellow-700' :
              isProfitable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOpen ? 'Open Position' : isProfitable ? 'Profitable' : 'Loss'}
            </div>
          </div>
        </div>

        {/* Main Trade Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className={`text-4xl p-3 rounded-full ${
                  isProfitable ? 'bg-green-100' : isLoss ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                                     {trade.instrumentType === 'STOCK' ? '📈' : trade.instrumentType === 'FUTURES' ? '⚡' : '🎯'}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{trade.symbol}</h2>
                                     <p className="text-gray-600">{trade.instrumentType} • {trade.type} Position</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Entry Date:</span>
                  <span className="font-medium">{formatDate(trade.entryDate)}</span>
                </div>

                {trade.exitDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Exit Date:</span>
                    <span className="font-medium">{formatDate(trade.exitDate)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{trade.quantity.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Entry Price:</span>
                  <span className="font-medium">{formatCurrency(trade.entryPrice)}</span>
                </div>

                {trade.exitPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Exit Price:</span>
                    <span className="font-medium">{formatCurrency(trade.exitPrice)}</span>
                  </div>
                )}

                {trade.strikePrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Strike Price:</span>
                    <span className="font-medium">{formatCurrency(trade.strikePrice)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - P&L and Risk Management */}
            <div>
              {trade.profitLoss !== null && trade.profitLoss !== undefined && (
                <div className={`p-6 rounded-xl mb-6 ${
                  isProfitable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Total P&L</p>
                    <p className={`text-4xl font-bold ${
                      isProfitable ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isProfitable ? '+' : ''}{formatCurrency(trade.profitLoss)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {((trade.profitLoss / (trade.entryPrice * trade.quantity)) * 100).toFixed(2)}% Return
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {trade.stopLoss && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Stop Loss:</span>
                    <span className="font-medium text-red-600">{formatCurrency(trade.stopLoss)}</span>
                  </div>
                )}

                {trade.targetPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Target Price:</span>
                    <span className="font-medium text-green-600">{formatCurrency(trade.targetPrice)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Investment:</span>
                  <span className="font-medium">{formatCurrency(trade.entryPrice * trade.quantity)}</span>
                </div>

                {trade.exitPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Exit Value:</span>
                    <span className="font-medium">{formatCurrency(trade.exitPrice * trade.quantity)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {trade.notes && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              📝 Notes
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{trade.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.push(`/trades?edit=${trade.id}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>✏️</span>
            <span>Edit Trade</span>
          </button>
          
          <button
            onClick={() => router.push('/trades')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>📋</span>
            <span>All Trades</span>
          </button>
        </div>
      </div>
    </div>
  );
} 