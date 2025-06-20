export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { rateLimit, corsHeaders } from '../../../lib/middleware';
import { handleApiError, ValidationError } from '../../../lib/errors';
import Papa from 'papaparse';
import { z } from 'zod';

const rateLimiter = rateLimit(10, 60000); // 10 imports per minute

// CSV row validation schema
const csvRowSchema = z.object({
  symbol: z.string().min(1).max(20),
  type: z.enum(['LONG', 'SHORT']),
  instrumentType: z.enum(['STOCK', 'FUTURES', 'OPTIONS']).default('STOCK'),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive().nullable().optional(),
  quantity: z.number().positive(),
  strikePrice: z.number().positive().nullable().optional(),
  entryDate: z.string(),
  exitDate: z.string().nullable().optional(),
  profitLoss: z.number().nullable().optional(),
  notes: z.string().max(1000).optional(),
  sector: z.string().max(50).optional(),
});

type ValidatedTrade = z.infer<typeof csvRowSchema>;

// File size limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ROWS = 10000; // Maximum rows per import
const BATCH_SIZE = 100; // Process in batches of 100

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimiter(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter || 60),
        }
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new ValidationError('File must be a CSV');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Read file content
    const fileText = await file.text();
    
    // Parse CSV with Papa Parse
    const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: resolve,
        error: reject,
      });
    });

    if (parseResult.errors.length > 0) {
      throw new ValidationError(`CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`);
    }

    const rows = parseResult.data as any[];
    
    if (rows.length === 0) {
      throw new ValidationError('No data found in CSV file');
    }

    if (rows.length > MAX_ROWS) {
      throw new ValidationError(`Too many rows. Maximum ${MAX_ROWS} rows allowed per import`);
    }

    // Process and validate rows
    const validatedTrades: ValidatedTrade[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        
        // Sanitize string inputs (server-safe sanitization)
        const sanitizeString = (str: string) => {
          if (!str) return '';
          // Remove HTML tags and dangerous characters
          return str.replace(/<[^>]*>/g, '').replace(/[<>'"&]/g, '').trim();
        };

        const sanitizedRow = {
          ...row,
          symbol: sanitizeString(row.symbol || '').toUpperCase(),
          notes: row.notes ? sanitizeString(row.notes) : undefined,
          sector: row.sector ? sanitizeString(row.sector) : undefined,
        };

        // Helper function to parse various date formats
        const parseDate = (dateStr: string | undefined | null): string | null => {
          if (!dateStr) return null;
          
          // Try to parse the date
          const date = new Date(dateStr);
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
            // Try common date formats
            const formats = [
              /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or M/D/YYYY
              /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
              /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
            ];
            
            for (const format of formats) {
              const match = dateStr.match(format);
              if (match) {
                let parsedDate: Date;
                if (format === formats[0]) { // MM/DD/YYYY
                  parsedDate = new Date(`${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`);
                } else if (format === formats[1]) { // YYYY-MM-DD
                  parsedDate = new Date(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
                } else { // DD-MM-YYYY
                  parsedDate = new Date(`${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`);
                }
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate.toISOString();
                }
              }
            }
            throw new Error('Invalid date format');
          }
          
          return date.toISOString();
        };

        // Convert and validate data types
        const processedRow = {
          symbol: sanitizedRow.symbol,
          type: (sanitizedRow.type || '').toUpperCase() === 'SELL' || (sanitizedRow.type || '').toUpperCase() === 'SHORT' ? 'SHORT' as const : 'LONG' as const,
          instrumentType: (sanitizedRow.instrumenttype || sanitizedRow.instrumentType || 'STOCK') as 'STOCK' | 'FUTURES' | 'OPTIONS',
          entryPrice: parseFloat(sanitizedRow.entryprice || sanitizedRow.entryPrice || '0'),
          exitPrice: sanitizedRow.exitprice || sanitizedRow.exitPrice ? parseFloat(sanitizedRow.exitprice || sanitizedRow.exitPrice) : null,
          quantity: parseFloat(sanitizedRow.quantity || '0'),
          strikePrice: sanitizedRow.strikeprice || sanitizedRow.strikePrice ? parseFloat(sanitizedRow.strikeprice || sanitizedRow.strikePrice) : null,
          entryDate: parseDate(sanitizedRow.entrydate || sanitizedRow.entryDate) || '',
          exitDate: parseDate(sanitizedRow.exitdate || sanitizedRow.exitDate),
          profitLoss: sanitizedRow.profitloss || sanitizedRow.profitLoss ? parseFloat(sanitizedRow.profitloss || sanitizedRow.profitLoss) : null,
          notes: sanitizedRow.notes || '',
          sector: sanitizedRow.sector || '',
        };

        // Validate with Zod schema
        const validated = csvRowSchema.parse(processedRow);
        validatedTrades.push(validated);

      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Validation failed'}`);
      }
    }

    if (errors.length > 0 && validatedTrades.length === 0) {
      throw new ValidationError(`All rows failed validation: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? '...' : ''}`);
    }

    // Batch insert to database
    let insertedCount = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < validatedTrades.length; i += BATCH_SIZE) {
      const batch = validatedTrades.slice(i, i + BATCH_SIZE);
      
      try {
        const result = await prisma.$transaction(async (tx) => {
          const insertPromises = batch.map(trade => 
            tx.trade.create({
              data: {
                symbol: trade.symbol,
                type: trade.type,
                instrumentType: trade.instrumentType,
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                quantity: trade.quantity,
                strikePrice: trade.strikePrice,
                entryDate: new Date(trade.entryDate),
                exitDate: trade.exitDate ? new Date(trade.exitDate) : null,
                profitLoss: trade.profitLoss,
                notes: trade.notes || null,
                sector: trade.sector || null,
              }
            })
          );
          
          return await Promise.all(insertPromises);
        });
        
        insertedCount += result.length;
      } catch (error) {
        console.error(`Batch insert error for rows ${i}-${i + batch.length}:`, error);
        insertErrors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Database insert failed`);
      }
    }

    const response = {
      success: true,
      message: `Import completed successfully`,
      data: {
        totalRows: rows.length,
        validatedRows: validatedTrades.length,
        insertedRows: insertedCount,
        validationErrors: errors.length,
        insertErrors: insertErrors.length,
      },
      errors: {
        validation: errors.slice(0, 10), // Limit error details
        insert: insertErrors,
      }
    };

    return NextResponse.json(response, {
      headers: corsHeaders(request.headers.get('origin') || undefined),
    });

  } catch (error) {
    const { data, status } = handleApiError(error);
    return NextResponse.json(data, { status });
  }
}

// GET endpoint for import history/status
export async function GET(request: NextRequest) {
  try {
    // Get recent import statistics
    const recentTrades = await prisma.trade.findMany({
      select: {
        createdAt: true,
        symbol: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const importStats = {
      totalTrades: await prisma.trade.count(),
      recentImports: recentTrades.length,
      lastImportDate: recentTrades[0]?.createdAt || null,
    };

    return NextResponse.json({
      success: true,
      data: importStats,
    }, {
      headers: corsHeaders(request.headers.get('origin') || undefined),
    });

  } catch (error) {
    const { data, status } = handleApiError(error);
    return NextResponse.json(data, { status });
  }
} 