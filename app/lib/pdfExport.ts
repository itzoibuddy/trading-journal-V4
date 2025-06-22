import jsPDF from 'jspdf';
import { Trade } from '../types/Trade';

interface UserInfo {
  name: string;
  email: string;
}

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  let yPosition = 20;

  // Header with branding
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  // Logo/Brand area
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Trading Journal', 20, 25);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Professional Trading Platform', 20, 32);
  
  // Date
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  const currentDate = new Date().toLocaleDateString('en-IN');
  pdf.text(`Generated on: ${currentDate}`, pageWidth - 60, 25);
  
  yPosition = 55;

  // User information
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Trade Report', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Prepared for: ${userInfo.name}`, 20, yPosition);
  yPosition += 5;
  pdf.text(`Email: ${userInfo.email}`, 20, yPosition);
  
  yPosition += 15;

  // Trade title section
  pdf.setDrawColor(79, 70, 229);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text(`${trade.symbol} - Trade Details`, 20, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text(`${trade.instrumentType?.toUpperCase()} • ${trade.strategy || 'No Strategy'}`, 20, yPosition);
  
  // Trade status and P&L
  const profitLoss = trade.profitLoss || 0;
  const isProfit = profitLoss > 0;
  pdf.setTextColor(isProfit ? 16 : 239, isProfit ? 185 : 68, isProfit ? 129 : 68);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(profitLoss), pageWidth - 60, yPosition - 8);
  
  yPosition += 15;

  // Trade overview box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(229, 231, 235);
  pdf.rect(20, yPosition, pageWidth - 40, 45, 'FD');
  
  yPosition += 12;
  
  // Trade information
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Position Type:', 25, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.type || 'N/A', 70, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Status:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitDate ? 'Closed' : 'Open', pageWidth/2 + 30, yPosition);
  
  yPosition += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Entry Date:', 25, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(trade.entryDate), 70, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Market Condition:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.marketCondition || 'Not Recorded', pageWidth/2 + 55, yPosition);
  
  yPosition += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Exit Date:', 25, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitDate ? formatDate(trade.exitDate) : 'Position Open', 70, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Time Frame:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.timeFrame || 'Not Specified', pageWidth/2 + 40, yPosition);
  
  yPosition += 20;

  // Price Information Table
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text('Price Information', 20, yPosition);
  
  yPosition += 10;
  
  // Table headers
  pdf.setFillColor(79, 70, 229);
  pdf.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Parameter', 25, yPosition);
  pdf.text('Value', pageWidth/2, yPosition);
  
  yPosition += 10;
  
  // Table rows
  const priceData = [
    ['Entry Price', `₹${formatNumber(trade.entryPrice)}`],
    ['Exit Price', trade.exitPrice ? `₹${formatNumber(trade.exitPrice)}` : 'Pending'],
    ['Quantity', trade.quantity?.toString() || '0'],
    ['Strike Price', trade.strikePrice ? `₹${formatNumber(trade.strikePrice)}` : 'N/A'],
    ['Stop Loss', trade.stopLoss ? `₹${formatNumber(trade.stopLoss)}` : 'Not Set'],
    ['Target Price', trade.targetPrice ? `₹${formatNumber(trade.targetPrice)}` : 'Not Set'],
  ];
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  
  priceData.forEach((row, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');
    
    pdf.text(row[0], 25, yPosition);
    pdf.text(row[1], pageWidth/2, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;

  // Investment Summary
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text('Investment Summary', 20, yPosition);
  
  yPosition += 10;
  
  const totalInvestment = (trade.entryPrice || 0) * (trade.quantity || 0);
  const exitValue = trade.exitPrice ? (trade.exitPrice || 0) * (trade.quantity || 0) : 0;
  
  // Investment summary box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(229, 231, 235);
  pdf.rect(20, yPosition - 5, pageWidth - 40, 25, 'FD');
  
  yPosition += 5;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Investment:', 25, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatCurrency(totalInvestment), 80, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Exit Value:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitPrice ? formatCurrency(exitValue) : 'Pending', pageWidth/2 + 45, yPosition);
  
  yPosition += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Net P&L:', 25, yPosition);
  pdf.setTextColor(isProfit ? 16 : 239, isProfit ? 185 : 68, isProfit ? 129 : 68);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(profitLoss), 55, yPosition);
  
  yPosition += 20;

  // Psychology Section
  if (trade.preTradeEmotion || trade.postTradeEmotion || trade.tradeConfidence || trade.tradeRating) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Trading Psychology', 20, yPosition);
    
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    
    if (trade.preTradeEmotion) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pre-Trade Emotion:', 25, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(trade.preTradeEmotion, 85, yPosition);
      yPosition += 6;
    }
    
    if (trade.postTradeEmotion) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Post-Trade Emotion:', 25, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(trade.postTradeEmotion, 90, yPosition);
      yPosition += 6;
    }
    
    if (trade.tradeConfidence) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Confidence Level:', 25, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${trade.tradeConfidence}/10`, 80, yPosition);
      yPosition += 6;
    }
    
    if (trade.tradeRating) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Trade Rating:', 25, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${trade.tradeRating}/10`, 70, yPosition);
      yPosition += 6;
    }
    
    yPosition += 10;
  }

  // Notes section
  if (trade.notes) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Trade Notes', 20, yPosition);
    
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const maxWidth = pageWidth - 50;
    const lines = pdf.splitTextToSize(trade.notes, maxWidth);
    
    const notesHeight = lines.length * 5 + 10;
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(20, yPosition - 5, pageWidth - 40, notesHeight, 'FD');
    
    yPosition += 3;
    lines.forEach((line: string) => {
      pdf.text(line, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
  }

  // Lessons learned section
  if (trade.lessons) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Lessons Learned', 20, yPosition);
    
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const maxWidth = pageWidth - 50;
    const lines = pdf.splitTextToSize(trade.lessons, maxWidth);
    
    const lessonsHeight = lines.length * 5 + 10;
    pdf.setFillColor(254, 252, 232);
    pdf.setDrawColor(217, 119, 6);
    pdf.rect(20, yPosition - 5, pageWidth - 40, lessonsHeight, 'FD');
    
    yPosition += 3;
    lines.forEach((line: string) => {
      pdf.text(line, 25, yPosition);
      yPosition += 5;
    });
  }

  // Footer
  const footerY = pageHeight - 20;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Generated by Trading Journal - Professional Trading Platform', 20, footerY);
  pdf.text('Page 1 of 1', pageWidth - 30, footerY);
  
  // Save the PDF
  const fileName = `${trade.symbol}_Trade_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}; 