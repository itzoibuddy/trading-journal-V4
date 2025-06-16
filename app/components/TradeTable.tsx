'use client';

import { useState, useEffect, useRef } from 'react';
import Pagination from './Pagination';
import { Trade } from '../types/Trade';

// Helper function to calculate lot size for a symbol
const getLotSize = (symbol: string): number => {
  if (symbol === 'NIFTY') return 75;
  if (symbol === 'SENSEX') return 20;
  return 1; // Default case for other symbols
};

// Helper function to format quantity as lots for display
const formatQuantityAsLots = (quantity: number, symbol: string): string => {
  const lotSize = getLotSize(symbol);
  if (lotSize <= 1) return quantity.toString();
  
  const lots = Math.round((quantity / lotSize) * 100) / 100;
  return `${quantity} (${lots} lots)`;
};

// Icon for trade type (LONG/SHORT)
const tradeTypeIcon = (type: 'LONG' | 'SHORT') =>
  type === 'LONG' ? (
    <svg className="h-5 w-5 text-green-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
  ) : (
    <svg className="h-5 w-5 text-red-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
  );

interface TradeTableProps {
  trades: Trade[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onViewDetails: (index: number) => void;
}

export default function TradeTable({ trades, onEdit, onDelete, onViewDetails }: TradeTableProps) {
  const [showDeleteIndex, setShowDeleteIndex] = useState<number | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<{[key: string]: boolean}>({
    symbol: true,
    type: true,
    strategy: true,
    entryPrice: true,
    exitPrice: true,
    quantity: true,
    strikePrice: true,
    profitLoss: true,
    rating: true,
    entryDate: true,
    actions: true
  });
  
  const [showColumnSelector, setShowColumnSelector] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tradesPerPage] = useState<number>(10);
  
  // Reference for the column selector dropdown
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  
  // Close the column selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setShowColumnSelector(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get current trades for pagination
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = trades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(trades.length / tradesPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Toggle column visibility
  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };
  
  // Reset column visibility to default
  const resetColumns = () => {
    setVisibleColumns({
      symbol: true,
      type: true,
      strategy: true,
      entryPrice: true,
      exitPrice: true,
      quantity: true,
      strikePrice: true,
      profitLoss: true,
      rating: true,
      entryDate: true,
      actions: true
    });
  };

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Trades</h2>
      
      {trades.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No trades found. Add your first trade above.</div>
      ) : (
        <div>
          {/* Column selector */}
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center px-3 py-1 bg-white text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300 transition-colors text-xs font-medium"
              >
                <svg className="h-4 w-4 mr-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Columns
              </button>
              
              {showColumnSelector && (
                <div ref={columnSelectorRef} className="absolute mt-2 ml-0 z-10 bg-white shadow-lg rounded-md border border-gray-200 p-3 w-64">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold">Show/Hide Columns</h3>
                    <button 
                      onClick={resetColumns}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.symbol} 
                        onChange={() => toggleColumn('symbol')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Symbol
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.type} 
                        onChange={() => toggleColumn('type')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Type
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.strategy} 
                        onChange={() => toggleColumn('strategy')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Strategy
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.entryPrice} 
                        onChange={() => toggleColumn('entryPrice')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Entry Price
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.exitPrice} 
                        onChange={() => toggleColumn('exitPrice')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Exit Price
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.quantity} 
                        onChange={() => toggleColumn('quantity')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Quantity
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.strikePrice} 
                        onChange={() => toggleColumn('strikePrice')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Strike Price
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.profitLoss} 
                        onChange={() => toggleColumn('profitLoss')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      P/L
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.rating} 
                        onChange={() => toggleColumn('rating')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Rating
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.entryDate} 
                        onChange={() => toggleColumn('entryDate')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Entry Date
                    </label>
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.actions} 
                        onChange={() => toggleColumn('actions')}
                        className="mr-2 h-4 w-4 text-indigo-600"
                      />
                      Actions
                    </label>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={() => setShowColumnSelector(false)}
                      className="px-3 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
              
              <span className="ml-4 text-sm text-gray-500">
                Showing {indexOfFirstTrade + 1}-{Math.min(indexOfLastTrade, trades.length)} of {trades.length} trades
              </span>
            </div>
            
            <div className="text-sm text-gray-500 flex items-center">
              <button 
                className="px-2 py-1 bg-white border border-gray-200 rounded-l-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300 transition-colors"
                onClick={() => {
                  const tableContainer = document.querySelector('.overflow-x-auto');
                  if (tableContainer) {
                    tableContainer.scrollLeft -= 200;
                  }
                }}
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-3 py-1 bg-gray-50 border-t border-b border-gray-200 text-gray-600 font-medium text-xs">Scroll</span>
              <button 
                className="px-2 py-1 bg-white border border-gray-200 rounded-r-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300 transition-colors"
                onClick={() => {
                  const tableContainer = document.querySelector('.overflow-x-auto');
                  if (tableContainer) {
                    tableContainer.scrollLeft += 200;
                  }
                }}
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <div className="min-w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {visibleColumns.symbol && (
                      <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Symbol
                      </th>
                    )}
                    {visibleColumns.type && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    )}
                    {visibleColumns.strategy && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Strategy
                      </th>
                    )}
                    {visibleColumns.entryPrice && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Entry Price
                      </th>
                    )}
                    {visibleColumns.exitPrice && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Exit Price
                      </th>
                    )}
                    {visibleColumns.quantity && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    )}
                    {visibleColumns.strikePrice && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Strike Price
                      </th>
                    )}
                    {visibleColumns.profitLoss && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        P/L
                      </th>
                    )}
                    {visibleColumns.rating && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                    )}
                    {visibleColumns.entryDate && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Entry Date
                      </th>
                    )}
                    {visibleColumns.actions && (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentTrades.map((trade, index) => (
                    <tr
                      key={trade.id || index}
                      className={
                        index % 2 === 0
                          ? 'bg-white'
                          : 'bg-gray-50'
                      }
                    >
                      {visibleColumns.symbol && (
                        <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-inherit border-r border-gray-200">
                          {trade.symbol}
                          {trade.instrumentType === 'OPTIONS' && (
                            <span className="ml-1 text-xs text-gray-500">
                              {trade.optionType} {trade.strikePrice && `@ ₹${trade.strikePrice.toLocaleString('en-IN')}`}
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.type && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {tradeTypeIcon(trade.type)}
                          <span className={trade.type === 'LONG' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                            {trade.type}
                          </span>
                        </td>
                      )}
                      {visibleColumns.strategy && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {trade.strategy ? (
                            trade.strategy
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-400">-</span>
                              <svg className="h-5 w-5 text-red-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-red-500 ml-1">No setup</span>
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.entryPrice && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ₹{trade.entryPrice.toLocaleString('en-IN')}
                        </td>
                      )}
                      {visibleColumns.exitPrice && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN')}` : '-'}
                        </td>
                      )}
                      {visibleColumns.quantity && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatQuantityAsLots(trade.quantity, trade.symbol)}
                        </td>
                      )}
                      {visibleColumns.strikePrice && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {trade.instrumentType === 'OPTIONS' && trade.strikePrice ? 
                            <span className="font-semibold text-indigo-700">₹{trade.strikePrice.toLocaleString('en-IN')}</span> : '-'}
                        </td>
                      )}
                      {visibleColumns.profitLoss && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          {trade.profitLoss ? (
                            <span className={trade.profitLoss > 0 ? 'text-green-700' : 'text-red-700'}>
                              {trade.profitLoss > 0 ? '+' : ''}₹{trade.profitLoss.toLocaleString('en-IN')}
                            </span>
                          ) : '-'}
                        </td>
                      )}
                      {visibleColumns.rating && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {trade.tradeRating ? (
                            <div className="flex items-center">
                              <span className={`font-semibold ${
                                trade.tradeRating >= 8 ? 'text-green-700' : 
                                trade.tradeRating >= 5 ? 'text-amber-600' : 
                                'text-red-700'
                              }`}>
                                {trade.tradeRating}
                              </span>
                              <span className="ml-1 text-gray-400">/10</span>
                            </div>
                          ) : '-'}
                        </td>
                      )}
                      {visibleColumns.entryDate && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(trade.entryDate).toLocaleString('en-IN')}
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                          <button
                            className="px-3 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md"
                            onClick={() => onEdit(indexOfFirstTrade + index)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md ml-2"
                            onClick={() => onViewDetails(indexOfFirstTrade + index)}
                          >
                            Details
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md ml-2"
                            onClick={() => setShowDeleteIndex(indexOfFirstTrade + index)}
                          >
                            Delete
                          </button>
                          {showDeleteIndex === indexOfFirstTrade + index && (
                            <span className="ml-2">
                              <span>Are you sure? </span>
                              <button
                                className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md"
                                onClick={() => onDelete(indexOfFirstTrade + index)}
                              >
                                Yes
                              </button>
                              <span className="mx-1">/</span>
                              <button
                                className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md"
                                onClick={() => setShowDeleteIndex(null)}
                              >
                                No
                              </button>
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {trades.length > tradesPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={paginate}
            />
          )}
        </div>
      )}
    </div>
  );
} 