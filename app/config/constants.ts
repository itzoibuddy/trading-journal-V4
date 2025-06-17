/**
 * Constants file for the MyTradingJournal app
 * Contains all hardcoded values used throughout the application to improve maintainability
 */

/**
 * Instrument Types enum
 * Represents the different types of tradable instruments
 */
export enum InstrumentType {
  STOCK = 'STOCK',
  FUTURES = 'FUTURES',
  OPTIONS = 'OPTIONS'
}

/**
 * Trade Type enum
 * Represents the direction of a trade (long or short)
 */
export enum TradeType {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

/**
 * Option Type enum
 * Represents the type of an option contract
 */
export enum OptionType {
  CALL = 'CALL',
  PUT = 'PUT'
}

/**
 * Lot Sizes for different indices
 * Each index has a specific lot size for derivatives trading
 */
export const LOT_SIZES: Record<string, number> = {
  NIFTY: 75,
  SENSEX: 20,
  BANKNIFTY: 30,
  // Default case
  DEFAULT: 1
};

/**
 * Default strike prices for different indices
 * Used as fallbacks when parsing trade data without explicit strike prices
 */
export const DEFAULT_STRIKE_PRICES: Record<string, number> = {
  NIFTY: 24900,
  SENSEX: 81500,
  BANKNIFTY: 45000,
  // Default fallback
  DEFAULT: 0
};

/**
 * Time frames available for trade analysis
 */
export const TIME_FRAMES = [
  { value: '1m', label: '1 minute' },
  { value: '2m', label: '2 minutes' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' }
];

/**
 * Market conditions for trade context
 */
export const MARKET_CONDITIONS = [
  { value: 'Bullish', label: 'Bullish' },
  { value: 'Bearish', label: 'Bearish' },
  { value: 'Sideways', label: 'Sideways' },
  { value: 'Volatile', label: 'Volatile' },
  { value: 'Trending', label: 'Trending' },
  { value: 'Ranging', label: 'Ranging' }
];

/**
 * Pre-trade emotions for psychological analysis
 */
export const PRE_TRADE_EMOTIONS = [
  { value: 'Confident', label: 'Confident' },
  { value: 'Nervous', label: 'Nervous' },
  { value: 'Excited', label: 'Excited' },
  { value: 'Fearful', label: 'Fearful' },
  { value: 'Calm', label: 'Calm' },
  { value: 'Impatient', label: 'Impatient' },
  { value: 'Greedy', label: 'Greedy' },
  { value: 'Uncertain', label: 'Uncertain' }
];

/**
 * Post-trade emotions for psychological analysis
 */
export const POST_TRADE_EMOTIONS = [
  { value: 'Satisfied', label: 'Satisfied' },
  { value: 'Disappointed', label: 'Disappointed' },
  { value: 'Relieved', label: 'Relieved' },
  { value: 'Frustrated', label: 'Frustrated' },
  { value: 'Proud', label: 'Proud' },
  { value: 'Regretful', label: 'Regretful' },
  { value: 'Indifferent', label: 'Indifferent' },
  { value: 'Excited', label: 'Excited' }
];

/**
 * CSV headers for standardized import format
 */
export const CSV_HEADERS = [
  'symbol',
  'type',
  'instrumentType',
  'entryPrice',
  'exitPrice',
  'quantity',
  'strikePrice',
  'expiryDate',
  'optionType',
  'entryDate',
  'exitDate',
  'profitLoss',
  'notes',
  'sector',
  'strategy',
  'timeFrame',
  'marketCondition',
  'stopLoss',
  'targetPrice',
  'riskRewardRatio',
  'preTradeEmotion',
  'postTradeEmotion',
  'tradeConfidence',
  'tradeRating',
  'lessons',
  'setupImageUrl'
];

/**
 * CSV headers alternative forms for better import compatibility
 */
export const CSV_HEADER_ALIASES: Record<string, string[]> = {
  'symbol': ['symbol'],
  'type': ['type'],
  'instrumentType': ['instrumenttype', 'instrument type', 'instrumentType'],
  'entryPrice': ['entryprice', 'entry price', 'entryPrice'],
  'exitPrice': ['exitprice', 'exit price', 'exitPrice'],
  'quantity': ['quantity', 'qty'],
  'strikePrice': ['strikeprice', 'strike price', 'strikePrice'],
  'expiryDate': ['expirydate', 'expiry date', 'expiryDate'],
  'optionType': ['optiontype', 'option type', 'optionType'],
  'entryDate': ['entrydate', 'entry date', 'entryDate'],
  'exitDate': ['exitdate', 'exit date', 'exitDate'],
  'profitLoss': ['profitloss', 'profit/loss', 'profitLoss'],
  'notes': ['notes'],
  'sector': ['sector']
};

/**
 * Broker format identifiers for CSV import
 */
export const BROKER_FORMAT_IDENTIFIERS = [
  'time', 'Time',
  'type', 'Type',
  'instrument', 'Instrument',
  'qty', 'qty.', 'Qty', 'Qty.',
  'avg. price', 'Avg. price'
];

/**
 * Default values for trade form
 */
export const DEFAULT_TRADE_FORM_VALUES = {
  instrumentType: InstrumentType.STOCK,
  type: TradeType.LONG,
  quantity: 1,
  entryPrice: 0,
  tradeConfidence: 5,
  tradeRating: 5,
  timeFrame: 'Daily'
};

/**
 * Time frames for trade summary filtering
 */
export const SUMMARY_TIME_FRAMES = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' }
];

/**
 * Pagination default values
 */
export const PAGINATION_DEFAULTS = {
  tradesPerPage: 10
};

/**
 * Table column configuration with default visibility settings
 */
export const TABLE_COLUMNS = {
  symbol: { label: 'Symbol', defaultVisible: true },
  type: { label: 'Type', defaultVisible: true },
  strategy: { label: 'Strategy', defaultVisible: true },
  entryPrice: { label: 'Entry Price', defaultVisible: true },
  exitPrice: { label: 'Exit Price', defaultVisible: true },
  quantity: { label: 'Quantity', defaultVisible: true },
  strikePrice: { label: 'Strike Price', defaultVisible: true },
  profitLoss: { label: 'P/L', defaultVisible: true },
  rating: { label: 'Rating', defaultVisible: true },
  entryDate: { label: 'Entry Date', defaultVisible: true },
  actions: { label: 'Actions', defaultVisible: true }
}; 