import jsPDF from 'jspdf';
import { Trade } from '../types/Trade';
import { LOT_SIZES } from '../config/constants';

interface UserInfo {
  name: string;
  email: string;
}

// Helper function to calculate lot size for a symbol
const getLotSize = (symbol: string): number => {
  return LOT_SIZES[symbol] ?? LOT_SIZES.DEFAULT;
};

// Helper function to format quantity as lots for display
const formatQuantityAsLots = (quantity: number, symbol: string): string => {
  const lotSize = getLotSize(symbol);
  if (lotSize <= 1) return quantity.toString();
  
  const lots = Math.round((quantity / lotSize) * 100) / 100;
  return `${quantity} (${lots} lots)`;
};

// Helper function to get trade type icon text
const getTradeTypeIcon = (instrumentType: string): string => {
  switch (instrumentType?.toLowerCase()) {
    case 'stock': return 'STOCK';
    case 'options': return 'OPTIONS';
    case 'futures': return 'FUTURES';
    default: return 'TRADE';
  }
};

// Helper function to get position type symbol
const getPositionTypeSymbol = (type: string): string => {
  return type?.toLowerCase() === 'long' ? 'LONG' : 'SHORT';
};

export const generateTradePDF = async (trade: Trade, userInfo: UserInfo) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // Helper functions
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00';
    }
    return value.toFixed(2);
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'No date';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTradeDuration = (entryDate: string | Date | null | undefined, exitDate: string | Date | null | undefined) => {
    if (!entryDate) return 'No entry date';
    if (!exitDate) return 'Position open';
    
    const entry = typeof entryDate === 'string' ? new Date(entryDate) : entryDate;
    const exit = typeof exitDate === 'string' ? new Date(exitDate) : exitDate;
    
    if (isNaN(entry.getTime()) || isNaN(exit.getTime())) return 'Invalid dates';
    
    const diffTime = Math.abs(exit.getTime() - entry.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes === 0) return '< 1 min';
        return `${diffMinutes} min`;
      }
      return `${diffHours}h ${diffMinutes % 60}m`;
    }
    
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      return `${weeks}w ${remainingDays}d`;
    }
    
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  let yPosition = 15;

  // Header with improved design
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  // Logo/Brand area
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Trading Journal', 15, 20);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Professional Trading Platform - Complete Trade Analysis', 15, 28);
  
  // Date and trade info on right
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  const currentDate = new Date().toLocaleDateString('en-IN');
  pdf.text(`Generated: ${currentDate}`, pageWidth - 55, 18);
  pdf.text(`Trade ID: ${trade.id || 'N/A'}`, pageWidth - 55, 25);
  
  yPosition = 45;

  // User information section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Trade Report', 15, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Trader: ${userInfo.name}`, 15, yPosition);
  yPosition += 5;
  pdf.text(`Email: ${userInfo.email}`, 15, yPosition);
  
  yPosition += 15;

  // Trade title section
  pdf.setDrawColor(79, 70, 229);
  pdf.setLineWidth(0.5);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text(`${getTradeTypeIcon(trade.instrumentType)} ${trade.symbol}`, 15, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  const positionInfo = `${getPositionTypeSymbol(trade.type)} • ${trade.strategy || 'No Strategy Specified'}`;
  pdf.text(positionInfo, 15, yPosition);
  
  // Trade status and P&L on the right
  const profitLoss = trade.profitLoss || 0;
  const isProfit = profitLoss > 0;
  const isLoss = profitLoss < 0;
  
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  if (isProfit) {
    pdf.setTextColor(16, 185, 129);
    pdf.text('PROFIT', pageWidth - 50, yPosition - 8);
  } else if (isLoss) {
    pdf.setTextColor(239, 68, 68);
    pdf.text('LOSS', pageWidth - 40, yPosition - 8);
  } else {
    pdf.text('PENDING', pageWidth - 50, yPosition - 8);
  }
  
  pdf.setTextColor(isProfit ? 16 : isLoss ? 239 : 107, isProfit ? 185 : isLoss ? 68 : 114, isProfit ? 129 : isLoss ? 68 : 128);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(profitLoss), pageWidth - 60, yPosition);
  
  yPosition += 15;

  // Trade overview box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.5);
  pdf.rect(15, yPosition, pageWidth - 30, 40, 'FD');
  
  yPosition += 8;
  
  // Trade information in two columns
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  
  // Left column
  pdf.setFont('helvetica', 'bold');
  pdf.text('Entry Date:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(trade.entryDate), 45, yPosition);
  
  yPosition += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Exit Date:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitDate ? formatDate(trade.exitDate) : 'Position Open', 45, yPosition);
  
  yPosition += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Market:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.marketCondition || 'Not Recorded', 40, yPosition);
  
  // Right column
  yPosition -= 12;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Status:', pageWidth/2 + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitDate ? 'Closed' : 'Open', pageWidth/2 + 25, yPosition);
  
  yPosition += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Duration:', pageWidth/2 + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(calculateTradeDuration(trade.entryDate, trade.exitDate), pageWidth/2 + 30, yPosition);
  
  yPosition += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Timeframe:', pageWidth/2 + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.timeFrame || 'Not Specified', pageWidth/2 + 35, yPosition);
  
  yPosition += 20;

  // Price Information Table
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text('Price & Quantity Information', 15, yPosition);
  
  yPosition += 8;
  
  // Table with better formatting
  const tableData = [
    ['Parameter', 'Value', 'Details'],
    ['Entry Price', `₹${formatNumber(trade.entryPrice)}`, 'Per unit'],
    ['Exit Price', trade.exitPrice ? `₹${formatNumber(trade.exitPrice)}` : 'Pending', trade.exitPrice ? 'Per unit' : 'Not closed'],
    ['Quantity', formatQuantityAsLots(trade.quantity || 0, trade.symbol), `${trade.quantity || 0} units`],
    ...(trade.strikePrice ? [['Strike Price', `₹${formatNumber(trade.strikePrice)}`, trade.optionType || 'Options']] : []),
    ...(trade.optionType ? [['Option Type', trade.optionType, 'Call/Put']] : []),
    ['Stop Loss', trade.stopLoss ? `₹${formatNumber(trade.stopLoss)}` : 'Not Set', 'Risk management'],
    ['Target', trade.targetPrice ? `₹${formatNumber(trade.targetPrice)}` : 'Not Set', 'Profit target'],
  ];
  
  // Table header
  pdf.setFillColor(79, 70, 229);
  pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Parameter', 20, yPosition + 5);
  pdf.text('Value', 70, yPosition + 5);
  pdf.text('Details', 130, yPosition + 5);
  
  yPosition += 8;
  
  // Table rows
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i];
    
    // Alternating row colors
    if (i % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.rect(15, yPosition, pageWidth - 30, 6, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(row[0], 20, yPosition + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.text(row[1], 70, yPosition + 4);
    pdf.setTextColor(107, 114, 128);
    pdf.text(row[2], 130, yPosition + 4);
    pdf.setTextColor(0, 0, 0);
    yPosition += 6;
  }
  
  yPosition += 10;

  // Investment Summary
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text('Investment Summary', 15, yPosition);
  
  yPosition += 8;
  
  const totalInvestment = (trade.entryPrice || 0) * (trade.quantity || 0);
  const exitValue = trade.exitPrice ? (trade.exitPrice || 0) * (trade.quantity || 0) : 0;
  
  // Summary box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(229, 231, 235);
  pdf.rect(15, yPosition, pageWidth - 30, 20, 'FD');
  
  yPosition += 6;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(9);
  
  // Left side
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Investment:', 20, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatCurrency(totalInvestment), 65, yPosition);
  
  // Right side
  pdf.setFont('helvetica', 'bold');
  pdf.text('Exit Value:', pageWidth/2 + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitPrice ? formatCurrency(exitValue) : 'Pending', pageWidth/2 + 35, yPosition);
  
  yPosition += 8;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Net P&L:', 20, yPosition);
  pdf.setTextColor(isProfit ? 16 : isLoss ? 239 : 107, isProfit ? 185 : isLoss ? 68 : 114, isProfit ? 129 : isLoss ? 68 : 128);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(profitLoss), 50, yPosition);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Risk/Reward:', pageWidth/2 + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.riskRewardRatio ? `1:${formatNumber(trade.riskRewardRatio)}` : 'Not calculated', pageWidth/2 + 45, yPosition);
  
  yPosition += 20;

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  // Psychology Section
  if (trade.preTradeEmotion || trade.postTradeEmotion || trade.tradeConfidence || trade.tradeRating) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Trading Psychology', 15, yPosition);
    
    yPosition += 8;
    
    // Psychology box
    pdf.setFillColor(254, 252, 232);
    pdf.setDrawColor(217, 119, 6);
    pdf.rect(15, yPosition, pageWidth - 30, 25, 'FD');
    
    yPosition += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    
    if (trade.preTradeEmotion) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pre-Trade Emotion:', 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(trade.preTradeEmotion, 70, yPosition);
      yPosition += 5;
    }
    
    if (trade.postTradeEmotion) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Post-Trade Emotion:', 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(trade.postTradeEmotion, 75, yPosition);
      yPosition += 5;
    }
    
    if (trade.tradeConfidence) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Confidence Level:', 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${trade.tradeConfidence}/10`, 65, yPosition);
      
      if (trade.tradeRating) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Trade Rating:', pageWidth/2 + 5, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${trade.tradeRating}/10`, pageWidth/2 + 40, yPosition);
      }
      yPosition += 5;
    } else if (trade.tradeRating) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Trade Rating:', 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${trade.tradeRating}/10`, 55, yPosition);
      yPosition += 5;
    }
    
    yPosition += 15;
  }

  // Chart section
  if (trade.setupImageUrl) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Chart Analysis', 15, yPosition);
    
    yPosition += 8;
    
    // Chart frame
    pdf.setDrawColor(79, 70, 229);
    pdf.setLineWidth(1);
    pdf.rect(15, yPosition, pageWidth - 30, 30, 'S');
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Chart image was attached to this trade', 20, yPosition + 10);
    pdf.text(`Image URL: ${trade.setupImageUrl?.substring(0, 40) || ''}...`, 20, yPosition + 17);
    pdf.setFontSize(8);
    pdf.text('Note: Chart images are preserved in digital format', 20, yPosition + 24);
    
    yPosition += 40;
  }

  // Notes section
  if (trade.notes) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Trade Notes', 15, yPosition);
    
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const maxWidth = pageWidth - 40;
    const lines = pdf.splitTextToSize(trade.notes, maxWidth);
    
    const notesHeight = lines.length * 4 + 10;
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(15, yPosition, pageWidth - 30, notesHeight, 'FD');
    
    yPosition += 5;
    lines.forEach((line: string) => {
      pdf.text(line, 20, yPosition);
      yPosition += 4;
    });
    
    yPosition += 10;
  }

  // Lessons learned section
  if (trade.lessons || trade.lessonsLearned) {
    const lessons = trade.lessons || trade.lessonsLearned || '';
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Lessons Learned', 15, yPosition);
    
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    const maxWidth = pageWidth - 40;
    const lines = pdf.splitTextToSize(lessons, maxWidth);
    
    const lessonsHeight = lines.length * 4 + 10;
    pdf.setFillColor(254, 252, 232);
    pdf.setDrawColor(217, 119, 6);
    pdf.rect(15, yPosition, pageWidth - 30, lessonsHeight, 'FD');
    
    yPosition += 5;
    lines.forEach((line: string) => {
      pdf.text(line, 20, yPosition);
      yPosition += 4;
    });
    
    yPosition += 10;
  }

  // Footer
  const footerY = pageHeight - 20;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(15, footerY - 5, pageWidth - 15, footerY - 5);
  
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Generated by Trading Journal - Professional Trading Platform', 15, footerY);
  pdf.text(`${new Date().toLocaleString('en-IN')}`, 15, footerY + 5);
  pdf.text('Page 1 of 1', pageWidth - 25, footerY);
  pdf.text(`Trade Report: ${trade.symbol}`, pageWidth - 70, footerY + 5);
  
  // Save the PDF with improved filename
  const profitStatus = isProfit ? 'PROFIT' : isLoss ? 'LOSS' : 'PENDING';
  const fileName = `${trade.symbol}_${trade.instrumentType}_${profitStatus}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}; 