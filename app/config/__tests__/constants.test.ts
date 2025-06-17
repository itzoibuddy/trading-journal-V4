/// <reference types="jest" />

import {
  InstrumentType,
  TradeType,
  OptionType,
  LOT_SIZES,
  DEFAULT_STRIKE_PRICES,
  TIME_FRAMES,
  MARKET_CONDITIONS,
  PRE_TRADE_EMOTIONS,
  POST_TRADE_EMOTIONS,
  CSV_HEADERS,
  CSV_HEADER_ALIASES,
  BROKER_FORMAT_IDENTIFIERS,
  DEFAULT_TRADE_FORM_VALUES,
  SUMMARY_TIME_FRAMES,
  PAGINATION_DEFAULTS,
  TABLE_COLUMNS
} from '../constants';

describe('Constants', () => {
  describe('Enums', () => {
    test('InstrumentType should have the correct values', () => {
      expect(InstrumentType.STOCK).toBe('STOCK');
      expect(InstrumentType.FUTURES).toBe('FUTURES');
      expect(InstrumentType.OPTIONS).toBe('OPTIONS');
    });

    test('TradeType should have the correct values', () => {
      expect(TradeType.LONG).toBe('LONG');
      expect(TradeType.SHORT).toBe('SHORT');
    });

    test('OptionType should have the correct values', () => {
      expect(OptionType.CALL).toBe('CALL');
      expect(OptionType.PUT).toBe('PUT');
    });
  });

  describe('LOT_SIZES', () => {
    test('should have the correct lot sizes', () => {
      expect(LOT_SIZES.NIFTY).toBe(75);
      expect(LOT_SIZES.SENSEX).toBe(20);
      expect(LOT_SIZES.BANKNIFTY).toBe(30);
      expect(LOT_SIZES.DEFAULT).toBe(1);
    });
  });

  describe('DEFAULT_STRIKE_PRICES', () => {
    test('should have the correct strike prices', () => {
      expect(DEFAULT_STRIKE_PRICES.NIFTY).toBe(24900);
      expect(DEFAULT_STRIKE_PRICES.SENSEX).toBe(81500);
      expect(DEFAULT_STRIKE_PRICES.DEFAULT).toBe(0);
    });
  });

  describe('TIME_FRAMES', () => {
    test('should have valid time frames', () => {
      expect(TIME_FRAMES.length).toBeGreaterThan(0);
      expect(TIME_FRAMES[0]).toHaveProperty('value');
      expect(TIME_FRAMES[0]).toHaveProperty('label');
    });
  });

  describe('MARKET_CONDITIONS', () => {
    test('should have valid market conditions', () => {
      expect(MARKET_CONDITIONS.length).toBeGreaterThan(0);
      expect(MARKET_CONDITIONS[0]).toHaveProperty('value');
      expect(MARKET_CONDITIONS[0]).toHaveProperty('label');
    });
  });

  describe('PRE_TRADE_EMOTIONS', () => {
    test('should have valid pre-trade emotions', () => {
      expect(PRE_TRADE_EMOTIONS.length).toBeGreaterThan(0);
      expect(PRE_TRADE_EMOTIONS[0]).toHaveProperty('value');
      expect(PRE_TRADE_EMOTIONS[0]).toHaveProperty('label');
    });
  });

  describe('POST_TRADE_EMOTIONS', () => {
    test('should have valid post-trade emotions', () => {
      expect(POST_TRADE_EMOTIONS.length).toBeGreaterThan(0);
      expect(POST_TRADE_EMOTIONS[0]).toHaveProperty('value');
      expect(POST_TRADE_EMOTIONS[0]).toHaveProperty('label');
    });
  });

  describe('CSV_HEADERS', () => {
    test('should have all the necessary CSV headers', () => {
      const requiredHeaders = [
        'symbol',
        'type',
        'instrumentType',
        'entryPrice',
        'exitPrice',
        'quantity'
      ];
      
      requiredHeaders.forEach(header => {
        expect(CSV_HEADERS).toContain(header);
      });
    });
  });

  describe('DEFAULT_TRADE_FORM_VALUES', () => {
    test('should have valid default values', () => {
      expect(DEFAULT_TRADE_FORM_VALUES).toHaveProperty('instrumentType', InstrumentType.STOCK);
      expect(DEFAULT_TRADE_FORM_VALUES).toHaveProperty('type', TradeType.LONG);
      expect(DEFAULT_TRADE_FORM_VALUES).toHaveProperty('quantity', 1);
    });
  });

  describe('PAGINATION_DEFAULTS', () => {
    test('should have valid pagination defaults', () => {
      expect(PAGINATION_DEFAULTS).toHaveProperty('tradesPerPage');
      expect(PAGINATION_DEFAULTS.tradesPerPage).toBeGreaterThan(0);
    });
  });

  describe('TABLE_COLUMNS', () => {
    test('should have valid table columns', () => {
      const requiredColumns = ['symbol', 'type', 'entryPrice', 'exitPrice', 'actions'];
      
      requiredColumns.forEach(column => {
        expect(TABLE_COLUMNS).toHaveProperty(column);
        expect(TABLE_COLUMNS[column as keyof typeof TABLE_COLUMNS]).toHaveProperty('label');
        expect(TABLE_COLUMNS[column as keyof typeof TABLE_COLUMNS]).toHaveProperty('defaultVisible');
      });
    });
  });
}); 