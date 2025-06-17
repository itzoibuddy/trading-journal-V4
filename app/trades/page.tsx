'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { getTrades, createTrade, updateTrade, deleteTrade, TradeFormData } from '../actions/trade';
import { Trade } from '../types/Trade';
import TradeForm from '../components/TradeForm';
import TradeTable from '../components/TradeTable';
import CSVImport from '../components/CSVImport';
import TradeSummary from '../components/TradeSummary';

// Helper function to format currency with 2 decimal places
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Improved helper function with debug logging
function convertDatesToISOString(obj: any) {
  console.log('Converting dates for object:', JSON.stringify(obj, (key, value) => {
    // Custom serializer to identify Date objects
    if (value instanceof Date) {
      return `[Date: ${value.toISOString()}]`;
    }
    return value;
  }, 2));
  
  const result = { ...obj };
  ['entryDate', 'exitDate', 'expiryDate'].forEach((key) => {
    if (result[key] instanceof Date) {
      console.log(`Converting ${key} from Date to ISO string`);
      result[key] = result[key].toISOString();
    } else if (result[key] && typeof result[key] === 'object' && 'toISOString' in result[key]) {
      // Handle Date-like objects
      console.log(`Converting ${key} from Date-like object to ISO string`);
      result[key] = result[key].toISOString();
    }
  });
  
  console.log('Converted result:', JSON.stringify(result, null, 2));
  return result;
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTrade, setEditTrade] = useState<{
    index: number | null;
    id: number | null;
    data?: TradeFormData;
  }>({
    index: null,
    id: null
  });
  const [showTradeDetails, setShowTradeDetails] = useState<boolean>(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrades() {
      try {
        setIsLoading(true);
        const data = await getTrades();
        setTrades(data.map(trade => convertDatesToISOString({
          ...trade,
          type: trade.type as 'LONG' | 'SHORT',
          instrumentType: trade.instrumentType as 'STOCK' | 'FUTURES' | 'OPTIONS'
        })));
        setError(null);
      } catch (err) {
        setError('Failed to load trades. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTrades();
  }, []);

  const handleSubmitTrade = async (data: TradeFormData) => {
    try {
      if (editTrade.id !== null) {
        // Edit existing trade
        await updateTrade(Number(editTrade.id), convertDatesToISOString(data));
        const updatedTrades = await getTrades();
        setTrades(updatedTrades.map(trade => convertDatesToISOString({
          ...trade,
          type: trade.type as 'LONG' | 'SHORT',
          instrumentType: trade.instrumentType as 'STOCK' | 'FUTURES' | 'OPTIONS'
        })));
        setEditTrade({
          index: null,
          id: null
        });
      } else {
        // Add new trade
        await createTrade(convertDatesToISOString(data));
        const updatedTrades = await getTrades();
        setTrades(updatedTrades.map(trade => convertDatesToISOString({
          ...trade,
          type: trade.type as 'LONG' | 'SHORT',
          instrumentType: trade.instrumentType as 'STOCK' | 'FUTURES' | 'OPTIONS'
        })));
      }
    } catch (err) {
      setError('Failed to save trade. Please try again.');
      console.error(err);
    }
  };

  const handleEditTrade = (index: number) => {
    const trade = trades[index];
    if (!trade || !trade.id) {
      console.error("Cannot edit trade: Invalid trade or missing ID", trade);
      return;
    }
    
    console.log("Editing trade:", trade);
    
    // Ensure dates are formatted as strings for the form
    const formattedTrade = {
      ...trade,
      entryDate: trade.entryDate instanceof Date ? trade.entryDate.toISOString() : trade.entryDate,
      exitDate: trade.exitDate instanceof Date ? trade.exitDate.toISOString() : trade.exitDate,
      expiryDate: trade.expiryDate instanceof Date ? trade.expiryDate.toISOString() : trade.expiryDate,
    };
    
    setEditTrade({
      index,
      id: trade.id,
      data: formattedTrade as TradeFormData
    });
  };

  const handleCancelEdit = () => {
    setEditTrade({
      index: null,
      id: null
    });
  };

  const handleDeleteTrade = async (index: number) => {
    if (!trades[index]?.id) return;
    
    try {
      await deleteTrade(trades[index].id!);
      setTrades(trades.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting trade:", error);
      setError("Failed to delete trade. Please try again.");
    }
  };

  const handleViewTradeDetails = (index: number) => {
    setSelectedTradeIndex(index);
    setShowTradeDetails(true);
  };
  
  const handleCloseTradeDetails = () => {
    setSelectedTradeIndex(null);
    setShowTradeDetails(false);
  };

  const handleImportTrades = async (importedTrades: TradeFormData[]) => {
    try {
      // Import each trade
      for (const trade of importedTrades) {
        try {
          await createTrade(convertDatesToISOString(trade));
        } catch (err) {
          console.error("Error creating trade:", trade, err);
          throw err;
        }
      }
      
      // Refresh the trade list
      const updatedTrades = await getTrades();
      setTrades(updatedTrades.map(trade => convertDatesToISOString({
        ...trade,
        type: trade.type as 'LONG' | 'SHORT'
      })));
      
      setImportMessage(`Successfully imported ${importedTrades.length} trades!`);
      setTimeout(() => setImportMessage(null), 4000);
    } catch (err) {
      console.error("Error in import process:", err);
      setError(`Failed to import trades: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Trades</h2>
        <CSVImport onImport={handleImportTrades} />
      </div>

      {importMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{importMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Trade summary section */}
      <TradeSummary trades={trades} />

      {/* Trade form section */}
      <TradeForm 
        initialData={editTrade.data && editTrade.id ? {...editTrade.data, id: editTrade.id} : undefined}
        onSuccess={() => {
          // This function will be called after form submission
          console.log("TradeForm success callback triggered");
          // Refresh trades list
          getTrades().then(updatedTrades => {
            setTrades(updatedTrades.map(trade => convertDatesToISOString({
              ...trade,
              type: trade.type as 'LONG' | 'SHORT',
              instrumentType: trade.instrumentType as 'STOCK' | 'FUTURES' | 'OPTIONS'
            })));
            
            // Reset edit state
            setEditTrade({
              index: null,
              id: null
            });
          }).catch(err => {
            console.error("Error refreshing trades after form submission:", err);
          });
        }}
        onCancel={handleCancelEdit} 
      />

      {/* Trade table section */}
      {isLoading ? (
        <div className="text-center py-4">Loading trades...</div>
      ) : (
        <TradeTable 
          trades={trades}
          onEdit={handleEditTrade}
          onDelete={handleDeleteTrade}
          onViewDetails={handleViewTradeDetails}
        />
      )}
      
      {/* Trade Details Modal */}
      {showTradeDetails && selectedTradeIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Trade Details: {trades[selectedTradeIndex].symbol}
                </h3>
                <button
                  onClick={handleCloseTradeDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Trade Setup Screenshot */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {trades[selectedTradeIndex].setupImageUrl ? (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Trade Setup</h4>
                      <img 
                        src={trades[selectedTradeIndex].setupImageUrl} 
                        alt="Trade Setup" 
                        className="w-full rounded-lg border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x800?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
                      No screenshot available
                    </div>
                  )}
                </div>
                
                {/* Trade Information */}
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Trade Information</h4>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Symbol</p>
                      <p className="font-medium">{trades[selectedTradeIndex].symbol}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className={`font-medium ${trades[selectedTradeIndex].type === 'LONG' ? 'text-green-700' : 'text-red-700'}`}>
                        {trades[selectedTradeIndex].type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Strategy</p>
                      {trades[selectedTradeIndex].strategy ? (
                        <p className="font-medium">{trades[selectedTradeIndex].strategy}</p>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-gray-400">-</span>
                          <svg className="h-5 w-5 text-red-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-red-500 ml-1">No setup</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Time Frame</p>
                      <p className="font-medium">{trades[selectedTradeIndex].timeFrame || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Entry Price</p>
                      <p className="font-medium">₹{formatCurrency(trades[selectedTradeIndex].entryPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Exit Price</p>
                      <p className="font-medium">
                        {trades[selectedTradeIndex].exitPrice 
                          ? `₹${formatCurrency(trades[selectedTradeIndex].exitPrice)}` 
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-medium">{trades[selectedTradeIndex].quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit/Loss</p>
                      <p className={`font-medium ${trades[selectedTradeIndex].profitLoss && trades[selectedTradeIndex].profitLoss > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {trades[selectedTradeIndex].profitLoss 
                          ? `${trades[selectedTradeIndex].profitLoss > 0 ? '+' : ''}₹${formatCurrency(trades[selectedTradeIndex].profitLoss)}` 
                          : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Trade Analysis</h4>
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Risk-Reward Ratio</p>
                        <p className="font-medium">{trades[selectedTradeIndex].riskRewardRatio || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stop Loss</p>
                        <p className="font-medium">
                          {trades[selectedTradeIndex].stopLoss 
                            ? `₹${formatCurrency(trades[selectedTradeIndex].stopLoss)}` 
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Target Price</p>
                        <p className="font-medium">
                          {trades[selectedTradeIndex].targetPrice 
                            ? `₹${formatCurrency(trades[selectedTradeIndex].targetPrice)}` 
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Market Condition</p>
                        <p className="font-medium">{trades[selectedTradeIndex].marketCondition || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pre-Trade Emotion</p>
                        <p className="font-medium">{trades[selectedTradeIndex].preTradeEmotion || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Post-Trade Emotion</p>
                        <p className="font-medium">{trades[selectedTradeIndex].postTradeEmotion || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Trade Confidence</p>
                        <div className="flex items-center">
                          {trades[selectedTradeIndex].tradeConfidence ? (
                            <>
                              <span className={`font-medium ${
                                trades[selectedTradeIndex].tradeConfidence >= 8 ? 'text-green-700' : 
                                trades[selectedTradeIndex].tradeConfidence >= 5 ? 'text-amber-600' : 
                                'text-red-700'
                              }`}>
                                {trades[selectedTradeIndex].tradeConfidence}
                              </span>
                              <span className="ml-1 text-gray-400 text-xs">/10</span>
                            </>
                          ) : '-'}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Trade Rating</p>
                        <div className="flex items-center">
                          {trades[selectedTradeIndex].tradeRating ? (
                            <>
                              <span className={`font-medium ${
                                trades[selectedTradeIndex].tradeRating >= 8 ? 'text-green-700' : 
                                trades[selectedTradeIndex].tradeRating >= 5 ? 'text-amber-600' : 
                                'text-red-700'
                              }`}>
                                {trades[selectedTradeIndex].tradeRating}
                              </span>
                              <span className="ml-1 text-gray-400 text-xs">/10</span>
                            </>
                          ) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(trades[selectedTradeIndex].notes || trades[selectedTradeIndex].lessons) && (
                    <div className="border-t border-gray-200 pt-4 mt-2">
                      {trades[selectedTradeIndex].notes && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Notes</p>
                          <p className="text-sm">{trades[selectedTradeIndex].notes}</p>
                        </div>
                      )}
                      
                      {trades[selectedTradeIndex].lessons && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Lessons Learned</p>
                          <p className="text-sm">{trades[selectedTradeIndex].lessons}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 