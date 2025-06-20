'use client';

import { useState } from 'react';

interface CSVImportServerProps {
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  data: {
    totalRows: number;
    validatedRows: number;
    insertedRows: number;
    validationErrors: number;
    insertErrors: number;
  };
  errors: {
    validation: string[];
    insert: string[];
  };
}

export default function CSVImportServer({ onImportComplete }: CSVImportServerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size exceeds 50MB limit');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/trades/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      setUploadResult(result);
      
      if (result.success && result.data.insertedRows > 0) {
        setTimeout(() => {
          onImportComplete();
          setUploadResult(null);
        }, 3000);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        symbol: 'RELIANCE',
        type: 'LONG',
        instrumentType: 'STOCK',
        entryPrice: '2850.50',
        exitPrice: '2950.75',
        quantity: '10',
        entryDate: '06/01/2025',
        exitDate: '06/01/2025',
        profitLoss: '1002.50',
        notes: 'Earnings momentum trade',
        sector: 'Energy'
      },
      {
        symbol: 'NIFTY',
        type: 'SHORT',
        instrumentType: 'OPTIONS',
        entryPrice: '45.25',
        exitPrice: '30.50',
        quantity: '75',
        strikePrice: '24900',
        entryDate: '06/02/2025',
        exitDate: '06/02/2025',
        profitLoss: '1106.25',
        notes: 'Put option trade',
        sector: 'Index'
      }
    ];

    const csvContent = [
      Object.keys(sampleData[0]).join(','),
      ...sampleData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trading_journal_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
      <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6 flex items-center">
        📁 CSV Import
      </h3>

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Upload CSV File (Max 50MB, 10,000 rows)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Supported date formats: MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:transition-all file:duration-300 disabled:opacity-50"
          />
        </div>

        {/* Download Sample */}
        <button
          onClick={downloadSampleCSV}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline transition-colors duration-300"
        >
          📄 Download Sample CSV Format
        </button>

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700 font-medium">Processing CSV file...</span>
            </div>
            <div className="mt-2 text-sm text-blue-600">
              Server is validating and importing your trades. Large files may take a moment.
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700 font-medium">Upload Failed</span>
            </div>
            <div className="mt-1 text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Success Result */}
        {uploadResult && uploadResult.success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-green-700 font-medium">Import Successful!</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-gray-600">
                  <span className="font-medium">Total Rows:</span> {uploadResult.data.totalRows}
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">Validated:</span> {uploadResult.data.validatedRows}
                </div>
                <div className="text-green-600">
                  <span className="font-medium">✅ Inserted:</span> {uploadResult.data.insertedRows}
                </div>
              </div>
              <div className="space-y-1">
                {uploadResult.data.validationErrors > 0 && (
                  <div className="text-orange-600">
                    <span className="font-medium">⚠️ Validation Errors:</span> {uploadResult.data.validationErrors}
                  </div>
                )}
                {uploadResult.data.insertErrors > 0 && (
                  <div className="text-red-600">
                    <span className="font-medium">❌ Insert Errors:</span> {uploadResult.data.insertErrors}
                  </div>
                )}
              </div>
            </div>

            {/* Error Details */}
            {uploadResult.errors.validation.length > 0 && (
              <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                <div className="font-medium text-orange-700 mb-2">Validation Issues:</div>
                <div className="text-sm text-orange-600 space-y-1">
                  {uploadResult.errors.validation.slice(0, 5).map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                  {uploadResult.errors.validation.length > 5 && (
                    <div>... and {uploadResult.errors.validation.length - 5} more</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Highlights */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <h4 className="font-semibold text-indigo-900 mb-2">🚀 Enterprise Features:</h4>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• ✅ <strong>Large Files:</strong> Up to 50MB and 10,000 rows</li>
            <li>• ✅ <strong>Batch Processing:</strong> Processes 100 records at a time</li>
            <li>• ✅ <strong>Server Validation:</strong> Validates every row before import</li>
            <li>• ✅ <strong>Error Recovery:</strong> Continues processing even if some rows fail</li>
            <li>• ✅ <strong>Rate Limited:</strong> Protected against abuse (10 imports/minute)</li>
            <li>• ✅ <strong>Transaction Safe:</strong> Database integrity guaranteed</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 