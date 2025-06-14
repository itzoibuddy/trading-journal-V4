'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Papa from 'papaparse';
import { getTrades, createTrade, updateTrade, deleteTrade } from '../actions/trade';
import { Trade, TradeFormData } from '../types/Trade';
import Pagination from '../components/Pagination';

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

const tradeTypeIcon = (type: 'LONG' | 'SHORT') =>
  type === 'LONG' ? (
    <svg className="h-5 w-5 text-green-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
  ) : (
    <svg className="h-5 w-5 text-red-500 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
  );

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteIndex, setShowDeleteIndex] = useState<number | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<string>("STOCK");
  const [showTradeDetails, setShowTradeDetails] = useState<boolean>(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [inputAsLots, setInputAsLots] = useState<boolean>(false);
  // Add pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tradesPerPage] = useState<number>(10);
  
  // Add column visibility state
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
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  
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

  // Helper function to format quantity as lots for display
  const formatQuantityAsLots = (quantity: number, symbol: string): string => {
    const lotSize = getLotSize(symbol);
    if (lotSize <= 1) return quantity.toString();
    
    const lots = Math.round((quantity / lotSize) * 100) / 100;
    return `${quantity} (${lots} lots)`;
  };

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

  // Add the watch variables for stop loss and target price
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

  useEffect(() => {
    async function loadTrades() {
      try {
        setIsLoading(true);
        const data = await getTrades();
        setTrades(data.map(trade => ({
          ...trade,
          entryDate: trade.entryDate instanceof Date ? trade.entryDate.toISOString() : trade.entryDate,
          exitDate: trade.exitDate instanceof Date ? trade.exitDate.toISOString() : trade.exitDate,
          expiryDate: trade.expiryDate instanceof Date ? trade.expiryDate.toISOString() : trade.expiryDate,
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

  const onSubmit = async (data: TradeFormData) => {
    try {
      if (editId !== null) {
      // Edit existing trade
        await updateTrade(Number(editId), data);
        const updatedTrades = await getTrades();
        setTrades(updatedTrades.map(trade => ({
          ...trade,
          entryDate: trade.entryDate instanceof Date ? trade.entryDate.toISOString() : trade.entryDate,
          exitDate: trade.exitDate instanceof Date ? trade.exitDate.toISOString() : trade.exitDate,
          expiryDate: trade.expiryDate instanceof Date ? trade.expiryDate.toISOString() : trade.expiryDate,
          type: trade.type as 'LONG' | 'SHORT',
          instrumentType: trade.instrumentType as 'STOCK' | 'FUTURES' | 'OPTIONS'
        })));
      setEditIndex(null);
        setEditId(null);
      reset();
    } else {
      // Add new trade
        await createTrade(data);
        const updatedTrades = await getTrades();
        setTrades(updatedTrades.map(trade => ({
          ...trade,
          entryDate: trade.entryDate instanceof Date ? trade.entryDate.toISOString() : trade.entryDate,
          exitDate: trade.exitDate instanceof Date ? trade.exitDate.toISOString() : trade.exitDate,
          expiryDate: trade.expiryDate instanceof Date ? trade.expiryDate.toISOString() : trade.expiryDate,
          type: trade.type as 'LONG' | 'SHORT',
          instrumentType: trade.instrumentType as 'STOCK' | 'FUTURES' | 'OPTIONS'
        })));
      reset();
      }
    } catch (err) {
      setError('Failed to save trade. Please try again.');
      console.error(err);
    }
  };

  const handleEdit = (index: number) => {
    const trade = trades[index];
    setEditIndex(index);
    setEditId(trade.id);
    
    // Check if this is likely a lot-based quantity for NIFTY or SENSEX
    const symbol = trade.symbol.toUpperCase();
    const lotSize = getLotSize(symbol);
    const isLotBased = (symbol === 'NIFTY' || symbol === 'SENSEX') && trade.quantity % lotSize === 0;
    
    // Set the inputAsLots state based on the trade
    setInputAsLots(isLotBased);
    
    // Helper function to safely get date string
    const getDateString = (dateValue: string | Date | null | undefined, format: 'datetime' | 'date'): string => {
      if (!dateValue) return '';
      
      let dateObj: Date;
      if (typeof dateValue === 'string') {
        dateObj = new Date(dateValue);
      } else {
        dateObj = dateValue;
      }
      
      if (format === 'datetime') {
        // Format: YYYY-MM-DDThh:mm
        return dateObj.toISOString().slice(0, 16);
      } else {
        // Format: YYYY-MM-DD
        return dateObj.toISOString().slice(0, 10);
      }
    };
    
    // Set form values - basic fields
    setValue('symbol', trade.symbol);
    setValue('type', trade.type);
    setValue('instrumentType', trade.instrumentType);
    setValue('entryPrice', trade.entryPrice);
    setValue('exitPrice', trade.exitPrice || undefined);
    setValue('quantity', trade.quantity);
    setValue('entryDate', getDateString(trade.entryDate, 'datetime'));
    setValue('exitDate', trade.exitDate ? getDateString(trade.exitDate, 'datetime') : undefined);
    setValue('profitLoss', trade.profitLoss || undefined);
    setValue('notes', trade.notes || '');
    setValue('sector', trade.sector || '');
    
    // Set options/futures specific fields
    if (trade.instrumentType === 'OPTIONS') {
      setValue('strikePrice', trade.strikePrice || undefined);
      setValue('expiryDate', trade.expiryDate ? getDateString(trade.expiryDate, 'date') : undefined);
      setValue('optionType', trade.optionType || undefined);
    } else if (trade.instrumentType === 'FUTURES') {
      setValue('expiryDate', trade.expiryDate ? getDateString(trade.expiryDate, 'date') : undefined);
    }
    
    // Set advanced trade journal fields
    setValue('strategy', trade.strategy || '');
    setValue('timeFrame', trade.timeFrame || '');
    setValue('marketCondition', trade.marketCondition || '');
    setValue('stopLoss', trade.stopLoss || undefined);
    setValue('targetPrice', trade.targetPrice || undefined);
    setValue('riskRewardRatio', trade.riskRewardRatio || undefined);
    setValue('preTradeEmotion', trade.preTradeEmotion || '');
    setValue('postTradeEmotion', trade.postTradeEmotion || '');
    setValue('tradeConfidence', trade.tradeConfidence || undefined);
    setValue('tradeRating', trade.tradeRating || undefined);
    setValue('lessons', trade.lessons || '');
    setValue('setupImageUrl', trade.setupImageUrl || '');
    
    setSelectedInstrumentType(trade.instrumentType);
  };

  const handleDelete = async (index: number) => {
    if (!trades[index]?.id) return;
    
    try {
      await deleteTrade(trades[index].id!);
      setTrades(trades.filter((_, i) => i !== index));
      setShowDeleteIndex(null);
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

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    
    // Preview the CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5, // Show only first 5 rows in preview
      complete: (results) => {
        setCsvPreview(results.data as any[]);
        setShowImportModal(true);
      },
      error: (error) => {
        console.error("Preview parse error:", error);
        setError('Failed to parse CSV file. Please check the format.');
      },
    });
  };
  
  const confirmImport = async () => {
    if (!csvFile) return;
    
    setIsImporting(true);
    setError(null); // Clear any previous errors
    
    try {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normalize header names by trimming whitespace and converting to lowercase
          return header.trim().toLowerCase();
        },
        complete: async (results) => {
          try {
            if (results.errors && results.errors.length > 0) {
              console.error("CSV parsing errors:", results.errors);
              setError(`CSV parsing error: ${results.errors[0].message}`);
              setIsImporting(false);
              return;
            }
            
            if (!results.data || results.data.length === 0) {
              setError('No data found in CSV file.');
              setIsImporting(false);
              return;
            }
            
            setImportMessage('Importing trades...');
            const imported: TradeFormData[] = [];
            
            // Process broker format CSV
            for (const row of results.data as any[]) {
              // Check if this is broker format (has Time, Type, Instrument, Product, Qty., Avg. price, Status)
              const isBrokerFormat = (row.time !== undefined || row.Time !== undefined) && 
                                    (row.type !== undefined || row.Type !== undefined) && 
                                    (row.instrument !== undefined || row.Instrument !== undefined) && 
                                    (row.qty !== undefined || row['qty.'] !== undefined || row.Qty !== undefined || row['Qty.'] !== undefined) && 
                                    (row['avg. price'] !== undefined || row['Avg. price'] !== undefined);
              
              if (isBrokerFormat) {
                // Get field values with fallbacks for different case variations
                const instrumentValue = row.instrument || row.Instrument || '';
                const typeValue = row.type || row.Type || '';
                const qtyValue = row.qty || row['qty.'] || row.Qty || row['Qty.'] || '';
                const timeValue = row.time || row.Time || '';
                const priceValue = row['avg. price'] || row['Avg. price'] || 0;
                
                // Extract data from broker format
                // Try to match the full pattern like NIFTY2561224900PE or SENSEX2561081500CE
                const instrumentParts = instrumentValue.match(/([A-Z]+)(\d{5})(\d{4,6})([CP]E)/i);
                let symbol = instrumentValue.includes('NIFTY') ? 'NIFTY' : 
                             instrumentValue.includes('SENSEX') ? 'SENSEX' : 'NIFTY';
                let strikePrice = 0; // Default to 0, will be updated if we can extract it
                let optionType = null;
                let expiryDate = null;
                
                if (instrumentParts && instrumentParts.length >= 5) {
                  symbol = instrumentParts[1]; // NIFTY or SENSEX
                  // The strike price is the third capture group (index 3)
                  const extractedStrikePrice = parseFloat(instrumentParts[3]); // Strike price
                  strikePrice = isNaN(extractedStrikePrice) || extractedStrikePrice <= 0 ? 
                                symbol === 'SENSEX' ? 81500 : 24900 : extractedStrikePrice; // Ensure positive value with appropriate defaults
                  optionType = instrumentParts[4] === 'CE' || instrumentParts[4] === 'ce' ? 'CALL' : 'PUT';
                  
                  // Try to extract expiry date from the second group (e.g., 25612 means 2025-06-12)
                  const dateCode = instrumentParts[2];
                  if (dateCode && dateCode.length >= 5) {
                    try {
                      const year = parseInt('20' + dateCode.substring(0, 2));
                      const month = parseInt(dateCode.substring(2, 4)) - 1; // JS months are 0-indexed
                      const day = parseInt(dateCode.substring(4));
                      expiryDate = new Date(year, month, day).toISOString().split('T')[0];
                    } catch (e) {
                      console.warn("Could not parse expiry date from", dateCode);
                    }
                  }
                } else {
                  // Try a pattern for formats like NIFTY24900PE or SENSEX81500CE
                  const directMatch = instrumentValue.match(/([A-Z]+)(\d{4,6})([CP]E)/i);
                  if (directMatch && directMatch.length >= 3) {
                    symbol = directMatch[1];
                    strikePrice = parseFloat(directMatch[2]);
                    optionType = directMatch[3].toUpperCase() === 'CE' ? 'CALL' : 'PUT';
                  } else {
                    // Try a more specific pattern for NIFTY2561224800PE or SENSEX2561081500CE format
                    // This extracts the last 4-6 digits before CE/PE as strike price
                    const specificMatch = instrumentValue.match(/([A-Z]+)(\d+)(\d{4,6})([CP]E)/i);
                    if (specificMatch && specificMatch.length >= 5) {
                      symbol = specificMatch[1];
                      strikePrice = parseFloat(specificMatch[3]);
                      optionType = specificMatch[4].toUpperCase() === 'CE' ? 'CALL' : 'PUT';
                      
                      // Try to extract expiry date from the second group
                      const dateCode = specificMatch[2];
                      if (dateCode && dateCode.length >= 5) {
                        try {
                          const year = parseInt('20' + dateCode.substring(0, 2));
                          const month = parseInt(dateCode.substring(2, 4)) - 1; // JS months are 0-indexed
                          const day = parseInt(dateCode.substring(4));
                          expiryDate = new Date(year, month, day).toISOString().split('T')[0];
                        } catch (e) {
                          console.warn("Could not parse expiry date from", dateCode);
                        }
                      }
                    } else {
                      // Try a simpler pattern to extract just the strike price
                      const simpleMatch = instrumentValue.match(/(\d{4,6})([CP]E)/i);
                      if (simpleMatch && simpleMatch.length >= 2) {
                        strikePrice = parseFloat(simpleMatch[1]);
                        optionType = simpleMatch[2].toUpperCase() === 'CE' ? 'CALL' : 'PUT';
                      } else {
                        // Try an even more general pattern
                        const generalMatch = instrumentValue.match(/(\d{4,6})/);
                        if (generalMatch && generalMatch.length >= 1) {
                          strikePrice = parseFloat(generalMatch[1]);
                          // Try to determine option type from the instrument string
                          optionType = instrumentValue.toUpperCase().includes('CE') ? 'CALL' : 
                                      instrumentValue.toUpperCase().includes('PE') ? 'PUT' : null;
                        } else {
                          // If we can't extract from the instrument name, set the default strike price based on symbol
                          strikePrice = symbol === 'SENSEX' ? 81500 : 24900;
                        }
                      }
                    }
                  }
                }
                
                // Convert BUY/SELL to LONG/SHORT
                const tradeType = typeValue.toUpperCase() === 'BUY' ? 'LONG' : 'SHORT';
                
                // Extract quantity (remove "/75" format if present)
                const quantityMatch = qtyValue.toString().match(/(\d+)/);
                let quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 0;
                
                // Handle lot sizes - if the quantity is in lots, convert to actual quantity
                // NIFTY 1 lot = 75 qty, SENSEX 1 lot = 20 qty
                if (quantity <= 10) { // Likely lot size rather than actual quantity
                  quantity = convertLotsToQuantity(quantity, symbol);
                }
                
                // Parse date from broker format
                const dateTimeParts = timeValue.split(' ');
                const entryDate = dateTimeParts.length === 2 ? timeValue.replace(' ', 'T') : timeValue;
                
                // Determine instrument type from the instrument name
                let instrumentType: 'STOCK' | 'FUTURES' | 'OPTIONS' = 'STOCK';
                if (instrumentValue.includes('PE') || instrumentValue.includes('CE')) {
                  instrumentType = 'OPTIONS';
                } else if (instrumentValue.includes('FUT')) {
                  instrumentType = 'FUTURES';
                }
                
                // Ensure optionType is either 'CALL', 'PUT', or null
                const finalOptionType: 'CALL' | 'PUT' | null = 
                  optionType === 'CALL' ? 'CALL' : 
                  optionType === 'PUT' ? 'PUT' : null;
                
                // Parse price
                const price = parseFloat(priceValue.toString());
                
                // Calculate lots for display in notes
                const lotSize = getLotSize(symbol);
                const lots = lotSize > 1 ? Math.round(quantity / lotSize * 100) / 100 : quantity;
                
                imported.push({
                  symbol,
                  type: tradeType,
                  instrumentType,
                  entryPrice: price,
                  exitPrice: null,
                  quantity,
                  strikePrice,
                  expiryDate: expiryDate,
                  optionType: finalOptionType,
                  premium: price,
                  entryDate,
                  exitDate: null,
                  profitLoss: null,
                  notes: `${instrumentValue} ${typeValue} @ ${price} (Strike: ${strikePrice}, Qty: ${quantity} = ${lots} lots)`,
                  sector: 'Index',
                });
              } else {
                // Original app format handling
                const symbol = row.symbol || '';
                const type = row.type || '';
                const entryPrice = row.entryprice || row['entry price'] || row.entryPrice || '';
                const quantity = row.quantity || row.qty || '';
                const entryDate = row.entrydate || row['entry date'] || row.entryDate || '';
                
                if (!symbol || !type || !entryPrice || !quantity || !entryDate) {
                  console.warn("Skipping row due to missing required fields:", row);
                  continue;
                }
                
                // Calculate profit/loss if not provided but exit price is available
                let profitLoss = row.profitloss || row['profit/loss'] || row.profitLoss ? parseFloat(row.profitloss || row['profit/loss'] || row.profitLoss) : null;
                const exitPrice = row.exitprice || row['exit price'] || row.exitPrice ? parseFloat(row.exitprice || row['exit price'] || row.exitPrice) : null;
                
                if (!profitLoss && exitPrice) {
                  const parsedEntryPrice = parseFloat(entryPrice);
                  const parsedQuantity = parseFloat(quantity);
                  const parsedType = type.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG';
                  
                  if (parsedType === 'LONG') {
                    profitLoss = (exitPrice - parsedEntryPrice) * parsedQuantity;
                  } else {
                    profitLoss = (parsedEntryPrice - exitPrice) * parsedQuantity;
                  }
                }
                
                // Get other fields with fallbacks
                const instrumentType = (row.instrumenttype || row['instrument type'] || row.instrumentType || 'STOCK').toUpperCase();
                const strikePrice = row.strikeprice || row['strike price'] || row.strikePrice ? parseFloat(row.strikeprice || row['strike price'] || row.strikePrice) : null;
                const optionType = row.optiontype || row['option type'] || row.optionType ? (row.optiontype || row['option type'] || row.optionType).toUpperCase() : null;
                const premium = row.premium ? parseFloat(row.premium) : null;
                const exitDate = row.exitdate || row['exit date'] || row.exitDate || null;
                const notes = row.notes || '';
                const sector = row.sector || '';
                const expiryDate = row.expirydate || row['expiry date'] || row.expiryDate || null;
                
                imported.push({
                  symbol,
                  type: type.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG',
                  instrumentType: instrumentType === 'OPTIONS' ? 'OPTIONS' : instrumentType === 'FUTURES' ? 'FUTURES' : 'STOCK',
                  entryPrice: parseFloat(entryPrice),
                  exitPrice,
                  quantity: parseFloat(quantity),
                  strikePrice,
                  expiryDate,
                  optionType: optionType === 'PUT' ? 'PUT' : optionType === 'CALL' ? 'CALL' : null,
                  premium,
                  entryDate,
                  exitDate,
                  profitLoss,
                  notes,
                  sector,
                });
              }
            }
            
            console.log("Trades to import:", imported);
            
            if (imported.length === 0) {
              setError('No valid trades found in the CSV file. Please check the format.');
              setIsImporting(false);
              return;
            }
            
            // Process related trades to calculate P/L
            const processedTrades = processRelatedTrades(imported);
            console.log("Processed trades with P/L:", processedTrades);
            
            // Import each trade
            for (const trade of processedTrades) {
              try {
                await createTrade(trade);
              } catch (err) {
                console.error("Error creating trade:", trade, err);
                throw err;
              }
            }
            
            // Refresh the trade list
            const updatedTrades = await getTrades();
            setTrades(updatedTrades.map(trade => ({
              ...trade,
              entryDate: trade.entryDate.toISOString(),
              exitDate: trade.exitDate?.toISOString() || null,
              type: trade.type as 'LONG' | 'SHORT'
            })));
            
            setImportMessage(`Successfully imported ${processedTrades.length} trades!`);
            setTimeout(() => setImportMessage(null), 4000);
            setShowImportModal(false);
            setCsvFile(null);
            setCsvPreview([]);
          } catch (err) {
            console.error("Error in CSV import process:", err);
            setError(`Failed to import trades: ${err instanceof Error ? err.message : 'Unknown error'}`);
          } finally {
            setIsImporting(false);
          }
        },
        error: (err) => {
          console.error("Papa parse error:", err);
          setError(`Failed to parse CSV: ${err.message}`);
          setIsImporting(false);
        },
      });
    } catch (err) {
      console.error("Top level error in confirmImport:", err);
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsImporting(false);
    }
  };
  
  const downloadSampleCSV = () => {
    const sampleData = [
      {
        symbol: 'RELIANCE',
        type: 'LONG',
        instrumentType: 'STOCK',
        entryPrice: '2850',
        exitPrice: '2950',
        quantity: '10',
        entryDate: '2025-06-01T10:00:00',
        exitDate: '2025-06-01T14:30:00',
        profitLoss: '1000',
        notes: 'Earnings momentum trade',
        sector: 'Energy'
      },
      {
        symbol: 'HDFCBANK',
        type: 'SHORT',
        instrumentType: 'STOCK',
        entryPrice: '1650',
        exitPrice: '1600',
        quantity: '20',
        entryDate: '2025-06-02T09:30:00',
        exitDate: '2025-06-02T15:45:00',
        profitLoss: '1000',
        notes: 'Technical breakdown',
        sector: 'Banking'
      },
      {
        symbol: 'NIFTY',
        type: 'LONG',
        instrumentType: 'FUTURES',
        entryPrice: '23400',
        exitPrice: '23650',
        quantity: '1',
        entryDate: '2025-06-03T09:30:00',
        exitDate: '2025-06-03T15:15:00',
        expiryDate: '2025-06-26',
        profitLoss: '250',
        notes: 'Trend following trade',
        sector: 'Index'
      },
      {
        symbol: 'RELIANCE',
        type: 'LONG',
        instrumentType: 'OPTIONS',
        entryPrice: '45',
        exitPrice: '85',
        quantity: '25',
        strikePrice: '3000',
        optionType: 'CALL',
        premium: '45',
        entryDate: '2025-06-04T10:15:00',
        exitDate: '2025-06-04T14:30:00',
        expiryDate: '2025-06-26',
        profitLoss: '1000',
        notes: 'Earnings play',
        sector: 'Energy'
      }
    ];
    
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_trades.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add this function to process related trades and calculate P/L
  const processRelatedTrades = (trades: TradeFormData[]): TradeFormData[] => {
    // Sort trades by date (oldest first)
    const sortedTrades = [...trades].sort((a, b) => {
      const dateA = new Date(a.entryDate);
      const dateB = new Date(b.entryDate);
      return dateA.getTime() - dateB.getTime();
    });

    // Group trades by instrument (symbol + strike price + option type)
    const tradeGroups: { [key: string]: TradeFormData[] } = {};
    
    for (const trade of sortedTrades) {
      const instrumentKey = `${trade.symbol}_${trade.strikePrice}_${trade.optionType}`;
      if (!tradeGroups[instrumentKey]) {
        tradeGroups[instrumentKey] = [];
      }
      tradeGroups[instrumentKey].push(trade);
    }
    
    const processedTrades: TradeFormData[] = [];
    
    // Process each group of trades
    for (const instrumentKey in tradeGroups) {
      const instrumentTrades = tradeGroups[instrumentKey];
      
      // In broker format:
      // BUY = LONG (entry)
      // SELL = SHORT (exit)
      const longTrades = instrumentTrades.filter(t => t.type === 'LONG');
      const shortTrades = instrumentTrades.filter(t => t.type === 'SHORT');
      
      // Group trades by "trade sequence" - a sequence starts with LONGs and ends with a SHORT
      // We'll identify trade sequences by looking at the timing
      const tradeSequences: {
        longs: TradeFormData[],
        short: TradeFormData | null,
        totalQty: number,
        avgEntryPrice: number,
        exitPrice: number | null,
        profitLoss: number,
        entryDate: string,
        exitDate: string | null
      }[] = [];
      
      // Initialize with the first sequence
      let currentSequence = {
        longs: [] as TradeFormData[],
        short: null as TradeFormData | null,
        totalQty: 0,
        avgEntryPrice: 0,
        exitPrice: null as number | null,
        profitLoss: 0,
        entryDate: '',
        exitDate: null as string | null
      };
      
      // Sort all trades by date
      const allTradesSorted = [...instrumentTrades].sort((a, b) => {
        const dateA = new Date(a.entryDate);
        const dateB = new Date(b.entryDate);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Group trades into sequences
      for (const trade of allTradesSorted) {
        if (trade.type === 'LONG') {
          // If we have a completed sequence, start a new one
          if (currentSequence.short !== null) {
            tradeSequences.push({...currentSequence});
            currentSequence = {
              longs: [],
              short: null,
              totalQty: 0,
              avgEntryPrice: 0,
              exitPrice: null,
              profitLoss: 0,
              entryDate: '',
              exitDate: null
            };
          }
          
          // Add this LONG to the current sequence
          currentSequence.longs.push(trade);
          
          // Update sequence info
          const oldTotalValue = currentSequence.avgEntryPrice * currentSequence.totalQty;
          const newValue = trade.entryPrice * trade.quantity;
          currentSequence.totalQty += trade.quantity;
          currentSequence.avgEntryPrice = (oldTotalValue + newValue) / currentSequence.totalQty;
          
          // Set entry date to the earliest LONG
          if (!currentSequence.entryDate || new Date(trade.entryDate) < new Date(currentSequence.entryDate)) {
            currentSequence.entryDate = trade.entryDate;
          }
        } else if (trade.type === 'SHORT') {
          // If this SHORT matches the current sequence's quantity
          if (trade.quantity === currentSequence.totalQty) {
            // Complete this sequence
            currentSequence.short = trade;
            currentSequence.exitPrice = trade.entryPrice;
            currentSequence.exitDate = trade.entryDate;
            currentSequence.profitLoss = (trade.entryPrice - currentSequence.avgEntryPrice) * currentSequence.totalQty;
            
            tradeSequences.push({...currentSequence});
            
            // Reset for next sequence
            currentSequence = {
              longs: [],
              short: null,
              totalQty: 0,
              avgEntryPrice: 0,
              exitPrice: null,
              profitLoss: 0,
              entryDate: '',
              exitDate: null
            };
          } else {
            // This is a partial exit or doesn't match any sequence
            // For now, just add it as a standalone trade
            processedTrades.push(trade);
          }
        }
      }
      
      // Add any incomplete sequence
      if (currentSequence.longs.length > 0) {
        tradeSequences.push(currentSequence);
      }
      
      // Create consolidated trades from sequences
      for (const sequence of tradeSequences) {
        if (sequence.longs.length > 0) {
          // Create a consolidated trade for this sequence
          const firstLong = sequence.longs[0];
          
          const consolidatedTrade: TradeFormData = {
            symbol: firstLong.symbol,
            type: 'LONG', // Always show as LONG for consolidated view
            instrumentType: firstLong.instrumentType,
            entryPrice: sequence.avgEntryPrice,
            exitPrice: sequence.exitPrice,
            quantity: sequence.totalQty,
            strikePrice: firstLong.strikePrice,
            expiryDate: firstLong.expiryDate,
            optionType: firstLong.optionType,
            premium: firstLong.premium,
            entryDate: sequence.entryDate,
            exitDate: sequence.exitDate,
            profitLoss: sequence.profitLoss,
            notes: `Consolidated trade (${sequence.longs.length} entries)`,
            sector: firstLong.sector,
          };
          
          processedTrades.push(consolidatedTrade);
        }
      }
    }
    
    return processedTrades;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Trades</h2>
        <div className="flex flex-wrap gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="file" accept=".csv" onChange={handleImportCSV} className="sr-only" />
            <button
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"][accept=".csv"]')?.click()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v18" />
              </svg>
              Import CSV
            </button>
          </label>

          <button
            onClick={() => downloadSampleCSV()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Sample CSV
          </button>
        </div>
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

      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{editIndex !== null ? 'Edit Trade' : 'Add New Trade'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            {editIndex !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditIndex(null);
                  setEditId(null);
                  reset();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
            >
              {isSubmitting ? 'Saving...' : editIndex !== null ? 'Update Trade' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Trades</h2>
        
        {isLoading ? (
          <div className="text-center py-4">Loading trades...</div>
        ) : trades.length === 0 ? (
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
                      onClick={() => {
                        resetColumns();
                      }}
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
                            onClick={() => handleEdit(indexOfFirstTrade + index)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md ml-2"
                            onClick={() => handleViewTradeDetails(indexOfFirstTrade + index)}
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
                                onClick={() => handleDelete(indexOfFirstTrade + index)}
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
                      <p className="font-medium">₹{trades[selectedTradeIndex].entryPrice.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Exit Price</p>
                      <p className="font-medium">
                        {trades[selectedTradeIndex].exitPrice 
                          ? `₹${trades[selectedTradeIndex].exitPrice.toLocaleString('en-IN')}` 
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-medium">{formatQuantityAsLots(trades[selectedTradeIndex].quantity, trades[selectedTradeIndex].symbol)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit/Loss</p>
                      <p className={`font-medium ${trades[selectedTradeIndex].profitLoss && trades[selectedTradeIndex].profitLoss > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {trades[selectedTradeIndex].profitLoss 
                          ? `${trades[selectedTradeIndex].profitLoss > 0 ? '+' : ''}₹${trades[selectedTradeIndex].profitLoss.toLocaleString('en-IN')}` 
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
                            ? `₹${trades[selectedTradeIndex].stopLoss.toLocaleString('en-IN')}` 
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Target Price</p>
                        <p className="font-medium">
                          {trades[selectedTradeIndex].targetPrice 
                            ? `₹${trades[selectedTradeIndex].targetPrice.toLocaleString('en-IN')}` 
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

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Import Trades from CSV</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setCsvPreview([]);
                  }}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Preview of the first 5 rows from your CSV file:
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {csvPreview.length > 0 && Object.keys(csvPreview[0]).map((header) => (
                          <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {csvPreview.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setCsvPreview([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={isImporting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : 'Import All Trades'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 