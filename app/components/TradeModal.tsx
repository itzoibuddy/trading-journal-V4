'use client';

import { useEffect, useRef } from 'react';
import TradeForm from './TradeForm';
import { TradeFormData } from '../actions/trade';

type TradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: (TradeFormData & { id?: number }) | undefined;
  title: string;
};

export default function TradeModal({ isOpen, onClose, initialData, title }: TradeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-gray-900/80 via-blue-900/80 to-indigo-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-6xl w-full max-h-[95vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200/50 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">✏️</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/90 text-gray-600 hover:text-gray-800 transition-all duration-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="px-8 py-6 max-h-[calc(95vh-120px)] overflow-y-auto">
          <TradeForm 
            initialData={initialData} 
            onSuccess={onClose} 
            onCancel={onClose} 
          />
        </div>
      </div>
    </div>
  );
} 