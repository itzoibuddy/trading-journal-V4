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
    case 'stock': return '📈 STOCK';
    case 'options': return '🔧 OPTIONS';
    case 'futures': return '⚡ FUTURES';
    default: return '💼 TRADE';
  }
};

// Helper function to get position type symbol
const getPositionTypeSymbol = (type: string): string => {
  return type?.toLowerCase() === 'long' ? '📈 LONG' : '📉 SHORT';
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTradeDuration = (entryDate: string | Date | null | undefined, exitDate: string | Date | null | undefined) => {
    if (!entryDate) return 'No entry date';
    if (!exitDate) return 'Position still open';
    
    const entry = typeof entryDate === 'string' ? new Date(entryDate) : entryDate;
    const exit = typeof exitDate === 'string' ? new Date(exitDate) : exitDate;
    
    if (isNaN(entry.getTime()) || isNaN(exit.getTime())) return 'Invalid dates';
    
    const diffTime = Math.abs(exit.getTime() - entry.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes === 0) return 'Less than 1 minute';
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${diffMinutes % 60} min`;
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

  let yPosition = 20;

  // Header with enhanced branding
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // Logo/Brand area with icon
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 Trading Journal', 20, 25);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Professional Trading Platform - Complete Trade Analysis', 20, 35);
  
  // Date and export info
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  const currentDate = new Date().toLocaleDateString('en-IN');
  pdf.text(`Generated: ${currentDate}`, pageWidth - 60, 25);
  pdf.text(`Trade ID: ${trade.id || 'N/A'}`, pageWidth - 60, 35);
  
  yPosition = 60;

  // User information section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📋 Trade Report', 20, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`👤 Trader: ${userInfo.name}`, 20, yPosition);
  yPosition += 5;
  pdf.text(`📧 Email: ${userInfo.email}`, 20, yPosition);
  
  yPosition += 15;

  // Trade title section with enhanced styling
  pdf.setDrawColor(79, 70, 229);
  pdf.setLineWidth(1);
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  
  yPosition += 12;
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text(`${getTradeTypeIcon(trade.instrumentType)} ${trade.symbol}`, 20, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  const positionInfo = `${getPositionTypeSymbol(trade.type)} • ${trade.strategy || 'No Strategy Specified'}`;
  pdf.text(positionInfo, 20, yPosition);
  
  // Trade status and P&L with enhanced styling
  const profitLoss = trade.profitLoss || 0;
  const isProfit = profitLoss > 0;
  const isLoss = profitLoss < 0;
  
  if (isProfit) {
    pdf.setTextColor(16, 185, 129); // Green
    pdf.text('✅ PROFIT', pageWidth - 70, yPosition - 16);
  } else if (isLoss) {
    pdf.setTextColor(239, 68, 68); // Red
    pdf.text('❌ LOSS', pageWidth - 70, yPosition - 16);
  } else {
    pdf.setTextColor(107, 114, 128); // Gray
    pdf.text('⏳ PENDING', pageWidth - 70, yPosition - 16);
  }
  
  pdf.setTextColor(isProfit ? 16 : isLoss ? 239 : 107, isProfit ? 185 : isLoss ? 68 : 114, isProfit ? 129 : isLoss ? 68 : 128);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(profitLoss), pageWidth - 70, yPosition - 4);
  
  yPosition += 15;

  // Trade overview enhanced box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(79, 70, 229);
  pdf.setLineWidth(0.5);
  pdf.rect(20, yPosition, pageWidth - 40, 55, 'FD');
  
  yPosition += 12;
  
  // Trade information grid
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  
  // Row 1
  pdf.setFont('helvetica', 'bold');
  pdf.text('📅 Entry Date:', 25, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(trade.entryDate), 70, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 Status:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitDate ? '🔴 Closed' : '🟢 Open', pageWidth/2 + 35, yPosition);
  
  yPosition += 8;
  
  // Row 2
  pdf.setFont('helvetica', 'bold');
  pdf.text('📤 Exit Date:', 25, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitDate ? formatDate(trade.exitDate) : '⏳ Position Open', 70, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('⏰ Duration:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(calculateTradeDuration(trade.entryDate, trade.exitDate), pageWidth/2 + 40, yPosition);
  
  yPosition += 8;
  
  // Row 3
  pdf.setFont('helvetica', 'bold');
  pdf.text('🌍 Market:', 25, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.marketCondition || 'Not Recorded', 55, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('⏱️ Timeframe:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.timeFrame || 'Not Specified', pageWidth/2 + 45, yPosition);
  
  yPosition += 8;
  
  // Row 4 - Sector and Strategy
  if (trade.sector) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('🏢 Sector:', 25, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(trade.sector, 50, yPosition);
  }
  
  if (trade.setupDescription) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('🎯 Setup:', pageWidth/2 + 10, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(trade.setupDescription.substring(0, 25) + '...', pageWidth/2 + 35, yPosition);
  }
  
  yPosition += 20;

  // Enhanced Price Information Table
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text('💰 Price & Quantity Information', 20, yPosition);
  
  yPosition += 12;
  
  // Table headers with icons
  pdf.setFillColor(79, 70, 229);
  pdf.rect(20, yPosition - 6, pageWidth - 40, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Parameter', 25, yPosition);
  pdf.text('Value', pageWidth/2, yPosition);
  pdf.text('Details', pageWidth - 60, yPosition);
  
  yPosition += 12;
  
  // Enhanced table rows with all information
  const priceData = [
    ['💵 Entry Price', `₹${formatNumber(trade.entryPrice)}`, `Per unit`],
    ['💸 Exit Price', trade.exitPrice ? `₹${formatNumber(trade.exitPrice)}` : '⏳ Pending', trade.exitPrice ? 'Per unit' : 'Not closed'],
    ['📦 Quantity', formatQuantityAsLots(trade.quantity || 0, trade.symbol), trade.quantity ? `${trade.quantity} units` : 'N/A'],
    ...(trade.strikePrice ? [['🎯 Strike Price', `₹${formatNumber(trade.strikePrice)}`, trade.optionType || 'Options']] : []),
    ...(trade.expiryDate ? [['📅 Expiry Date', formatDate(trade.expiryDate), 'Contract expiry']] : []),
    ...(trade.optionType ? [['🔧 Option Type', trade.optionType, 'Call/Put']] : []),
    ...(trade.premium ? [['💎 Premium', `₹${formatNumber(trade.premium)}`, 'Per unit']] : []),
    ['🛑 Stop Loss', trade.stopLoss ? `₹${formatNumber(trade.stopLoss)}` : '❌ Not Set', trade.stopLoss ? 'Risk management' : 'No protection'],
    ['🎯 Target', trade.targetPrice ? `₹${formatNumber(trade.targetPrice)}` : '❌ Not Set', trade.targetPrice ? 'Profit target' : 'No target'],
  ];
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  priceData.forEach((row, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.rect(20, yPosition - 4, pageWidth - 40, 8, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(row[0], 25, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(row[1], pageWidth/2, yPosition);
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(row[2], pageWidth - 60, yPosition);
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;
  });
  
  yPosition += 10;

  // Enhanced Investment Summary
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229);
  pdf.text('📊 Investment Summary', 20, yPosition);
  
  yPosition += 12;
  
  const totalInvestment = (trade.entryPrice || 0) * (trade.quantity || 0);
  const exitValue = trade.exitPrice ? (trade.exitPrice || 0) * (trade.quantity || 0) : 0;
  const riskAmount = trade.stopLoss ? Math.abs((trade.entryPrice || 0) - trade.stopLoss) * (trade.quantity || 0) : 0;
  const targetGain = trade.targetPrice ? Math.abs(trade.targetPrice - (trade.entryPrice || 0)) * (trade.quantity || 0) : 0;
  
  // Investment summary enhanced box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(79, 70, 229);
  pdf.rect(20, yPosition - 6, pageWidth - 40, 35, 'FD');
  
  yPosition += 4;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  
  // Row 1
  pdf.setFont('helvetica', 'bold');
  pdf.text('💰 Total Investment:', 25, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatCurrency(totalInvestment), 80, yPosition);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('💸 Exit Value:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.exitPrice ? formatCurrency(exitValue) : '⏳ Pending', pageWidth/2 + 50, yPosition);
  
  yPosition += 8;
  
  // Row 2
  pdf.setFont('helvetica', 'bold');
  pdf.text('📈 Net P&L:', 25, yPosition);
  pdf.setTextColor(isProfit ? 16 : isLoss ? 239 : 107, isProfit ? 185 : isLoss ? 68 : 114, isProfit ? 129 : isLoss ? 68 : 128);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(profitLoss), 65, yPosition);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('⚖️ Risk/Reward:', pageWidth/2 + 10, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(trade.riskRewardRatio ? `1:${formatNumber(trade.riskRewardRatio)}` : 'Not calculated', pageWidth/2 + 60, yPosition);
  
  yPosition += 8;
  
  // Row 3
  if (riskAmount > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('🛑 Risk Amount:', 25, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(239, 68, 68);
    pdf.text(formatCurrency(riskAmount), 75, yPosition);
  }
  
  if (targetGain > 0) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🎯 Target Gain:', pageWidth/2 + 10, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(16, 185, 129);
    pdf.text(formatCurrency(targetGain), pageWidth/2 + 55, yPosition);
  }
  
  yPosition += 20;

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    pdf.addPage();
    yPosition = 20;
  }

  // Enhanced Psychology Section
  if (trade.preTradeEmotion || trade.postTradeEmotion || trade.tradeConfidence || trade.tradeRating) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🧠 Trading Psychology', 20, yPosition);
    
    yPosition += 12;
    
    // Psychology box
    pdf.setFillColor(254, 252, 232);
    pdf.setDrawColor(217, 119, 6);
    pdf.rect(20, yPosition - 6, pageWidth - 40, 30, 'FD');
    
    yPosition += 4;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    
    if (trade.preTradeEmotion) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('😊 Pre-Trade Emotion:', 25, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(trade.preTradeEmotion, 90, yPosition);
      yPosition += 6;
    }
    
    if (trade.postTradeEmotion) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('😌 Post-Trade Emotion:', 25, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(trade.postTradeEmotion, 95, yPosition);
      yPosition += 6;
    }
    
    if (trade.tradeConfidence) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('💪 Confidence Level:', 25, yPosition);
      pdf.setFont('helvetica', 'normal');
      const stars = '⭐'.repeat(Math.min(trade.tradeConfidence, 10));
      pdf.text(`${trade.tradeConfidence}/10 ${stars}`, 85, yPosition);
      
      if (trade.tradeRating) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('📊 Trade Rating:', pageWidth/2 + 10, yPosition);
        pdf.setFont('helvetica', 'normal');
        const ratingStars = '⭐'.repeat(Math.min(trade.tradeRating, 10));
        pdf.text(`${trade.tradeRating}/10 ${ratingStars}`, pageWidth/2 + 60, yPosition);
      }
      yPosition += 6;
    } else if (trade.tradeRating) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('📊 Trade Rating:', 25, yPosition);
      pdf.setFont('helvetica', 'normal');
      const ratingStars = '⭐'.repeat(Math.min(trade.tradeRating, 10));
      pdf.text(`${trade.tradeRating}/10 ${ratingStars}`, 75, yPosition);
      yPosition += 6;
    }
    
    yPosition += 15;
  }

  // Chart section placeholder with enhanced design
  if (trade.setupImageUrl) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('📊 Chart Analysis', 20, yPosition);
    
    yPosition += 12;
    
    // Chart frame
    pdf.setDrawColor(79, 70, 229);
    pdf.setLineWidth(2);
    pdf.rect(20, yPosition, pageWidth - 40, 40, 'S');
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('📈 Chart image was attached to this trade', 25, yPosition + 15);
    pdf.text(`🔗 Image URL: ${trade.setupImageUrl?.substring(0, 50) || ''}...`, 25, yPosition + 25);
    pdf.setFontSize(10);
    pdf.text('💡 Note: Chart images are preserved in digital format', 25, yPosition + 35);
    
    yPosition += 50;
  }

  // Enhanced Notes section
  if (trade.notes) {
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('📝 Trade Notes', 20, yPosition);
    
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const maxWidth = pageWidth - 50;
    const lines = pdf.splitTextToSize(trade.notes, maxWidth);
    
    const notesHeight = lines.length * 5 + 10;
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(229, 231, 235);
    pdf.rect(20, yPosition - 2, pageWidth - 40, notesHeight, 'FD');
    
    yPosition += 6;
    lines.forEach((line: string) => {
      pdf.text(line, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
  }

  // Enhanced Lessons learned section
  if (trade.lessons || trade.lessonsLearned) {
    const lessons = trade.lessons || trade.lessonsLearned;
    pdf.setTextColor(79, 70, 229);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🎓 Lessons Learned', 20, yPosition);
    
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const maxWidth = pageWidth - 50;
    const lines = pdf.splitTextToSize(lessons, maxWidth);
    
    const lessonsHeight = lines.length * 5 + 10;
    pdf.setFillColor(254, 252, 232);
    pdf.setDrawColor(217, 119, 6);
    pdf.rect(20, yPosition - 2, pageWidth - 40, lessonsHeight, 'FD');
    
    yPosition += 6;
    lines.forEach((line: string) => {
      pdf.text(line, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
  }

  // Enhanced Footer
  const footerY = pageHeight - 25;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(20, footerY - 10, pageWidth - 20, footerY - 10);
  
  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('📊 Generated by Trading Journal - Professional Trading Platform', 20, footerY - 5);
  pdf.text(`🕒 ${new Date().toLocaleString('en-IN')}`, 20, footerY);
  pdf.text('Page 1 of 1', pageWidth - 30, footerY - 5);
  pdf.text(`📄 Trade Report: ${trade.symbol}`, pageWidth - 60, footerY);
  
  // Save the PDF with enhanced filename
  const profitStatus = isProfit ? 'PROFIT' : isLoss ? 'LOSS' : 'PENDING';
  const fileName = `${trade.symbol}_${trade.instrumentType}_${profitStatus}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}; 