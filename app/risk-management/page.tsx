'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function RiskManagementPage() {
  // Position sizing calculator state
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);
  const [positionSize, setPositionSize] = useState<number>(0);
  const [maxRiskAmount, setMaxRiskAmount] = useState<number>(0);
  const [tradeType, setTradeType] = useState<'LONG' | 'SHORT'>('LONG');

  // Stop-loss and take-profit calculator state
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0);
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0);
  const [potentialProfit, setPotentialProfit] = useState<number>(0);
  const [potentialLoss, setPotentialLoss] = useState<number>(0);
  const [winRate, setWinRate] = useState<number>(50);
  const [expectedValue, setExpectedValue] = useState<number>(0);

  // Risk-reward visualization data
  const [riskRewardData, setRiskRewardData] = useState({
    labels: ['Current Price'],
    datasets: [
      {
        label: 'Price Levels',
        data: [0],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  });

  // Calculate position size and risk metrics
  useEffect(() => {
    if (accountSize && riskPercentage && entryPrice && stopLossPrice && entryPrice !== stopLossPrice) {
      // Calculate max risk amount based on account size and risk percentage
      const maxRisk = accountSize * (riskPercentage / 100);
      setMaxRiskAmount(maxRisk);
      
      // Calculate risk per share/contract
      let riskPerUnit = 0;
      if (tradeType === 'LONG') {
        riskPerUnit = entryPrice - stopLossPrice;
      } else {
        riskPerUnit = stopLossPrice - entryPrice;
      }
      
      // Avoid division by zero
      if (riskPerUnit > 0) {
        // Calculate position size (quantity)
        const calculatedPositionSize = maxRisk / riskPerUnit;
        setPositionSize(Math.floor(calculatedPositionSize));
        
        // Calculate potential loss
        const calculatedPotentialLoss = -1 * Math.floor(calculatedPositionSize) * riskPerUnit;
        setPotentialLoss(calculatedPotentialLoss);
        
        // Calculate potential profit if take profit is set
        if (takeProfitPrice > 0) {
          let profitPerUnit = 0;
          if (tradeType === 'LONG') {
            profitPerUnit = takeProfitPrice - entryPrice;
          } else {
            profitPerUnit = entryPrice - takeProfitPrice;
          }
          
          const calculatedPotentialProfit = Math.floor(calculatedPositionSize) * profitPerUnit;
          setPotentialProfit(calculatedPotentialProfit);
          
          // Calculate risk-reward ratio
          if (riskPerUnit > 0) {
            const calculatedRiskRewardRatio = profitPerUnit / riskPerUnit;
            setRiskRewardRatio(calculatedRiskRewardRatio);
          }
          
          // Calculate expected value
          const winProbability = winRate / 100;
          const lossProbability = 1 - winProbability;
          const calculatedExpectedValue = (calculatedPotentialProfit * winProbability) + (calculatedPotentialLoss * lossProbability);
          setExpectedValue(calculatedExpectedValue);
        }
      }
      
      // Update risk-reward visualization
      updateRiskRewardVisualization();
    }
  }, [accountSize, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice, tradeType, winRate]);
  
  // Update risk-reward visualization chart
  const updateRiskRewardVisualization = () => {
    if (!entryPrice || !stopLossPrice) return;
    
    const pricePoints = [];
    const labels = [];
    const backgroundColors = [];
    const borderColors = [];
    
    // Add stop loss point
    pricePoints.push(stopLossPrice);
    labels.push('Stop Loss');
    backgroundColors.push('rgba(255, 99, 132, 0.5)');
    borderColors.push('rgb(255, 99, 132)');
    
    // Add entry point
    pricePoints.push(entryPrice);
    labels.push('Entry');
    backgroundColors.push('rgba(54, 162, 235, 0.5)');
    borderColors.push('rgb(54, 162, 235)');
    
    // Add take profit point if available
    if (takeProfitPrice > 0) {
      pricePoints.push(takeProfitPrice);
      labels.push('Take Profit');
      backgroundColors.push('rgba(75, 192, 192, 0.5)');
      borderColors.push('rgb(75, 192, 192)');
    }
    
    // Sort points for proper visualization
    const sortedData = labels.map((label, index) => ({
      label,
      price: pricePoints[index],
      backgroundColor: backgroundColors[index],
      borderColor: borderColors[index]
    }));
    
    if (tradeType === 'LONG') {
      sortedData.sort((a, b) => a.price - b.price);
    } else {
      sortedData.sort((a, b) => b.price - a.price);
    }
    
    setRiskRewardData({
      labels: sortedData.map(item => item.label),
      datasets: [
        {
          label: 'Price Levels',
          data: sortedData.map(item => item.price),
          backgroundColor: sortedData.map(item => item.backgroundColor),
          borderColor: sortedData.map(item => item.borderColor),
          borderWidth: 1,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    });
  };
  
  const handleRiskPercentageChange = (value: number) => {
    if (value >= 0 && value <= 100) {
      setRiskPercentage(value);
    }
  };
  
  const handleWinRateChange = (value: number) => {
    if (value >= 0 && value <= 100) {
      setWinRate(value);
    }
  };
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Risk Management Tools</h2>
      
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Size Calculator</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="accountSize" className="block text-sm font-medium text-gray-700">
                Account Size (₹)
              </label>
              <input
                type="number"
                id="accountSize"
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="riskPercentage" className="block text-sm font-medium text-gray-700">
                Risk per Trade (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="riskPercentage"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={riskPercentage}
                  onChange={(e) => handleRiskPercentageChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 min-w-[40px] text-right">
                  {riskPercentage}%
                </span>
              </div>
            </div>
            
            <div>
              <label htmlFor="tradeType" className="block text-sm font-medium text-gray-700">
                Trade Type
              </label>
              <select
                id="tradeType"
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value as 'LONG' | 'SHORT')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700">
                Entry Price (₹)
              </label>
              <input
                type="number"
                id="entryPrice"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="stopLossPrice" className="block text-sm font-medium text-gray-700">
                Stop Loss Price (₹)
              </label>
              <input
                type="number"
                id="stopLossPrice"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="takeProfitPrice" className="block text-sm font-medium text-gray-700">
                Take Profit Price (₹)
              </label>
              <input
                type="number"
                id="takeProfitPrice"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="winRate" className="block text-sm font-medium text-gray-700">
                Expected Win Rate (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="winRate"
                  min="0"
                  max="100"
                  step="1"
                  value={winRate}
                  onChange={(e) => handleWinRateChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 min-w-[40px] text-right">
                  {winRate}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <h4 className="text-md font-semibold text-gray-800">Results</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm font-medium text-gray-500">Max Risk Amount</div>
                <div className="text-xl font-bold text-gray-900">₹{maxRiskAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-gray-500 mt-1">{riskPercentage}% of account</div>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm font-medium text-gray-500">Position Size</div>
                <div className="text-xl font-bold text-gray-900">{positionSize.toLocaleString('en-IN')} units</div>
                <div className="text-xs text-gray-500 mt-1">Maximum quantity based on risk</div>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm font-medium text-gray-500">Risk-Reward Ratio</div>
                <div className="text-xl font-bold text-gray-900">{riskRewardRatio.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">Profit potential vs. risk</div>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm font-medium text-gray-500">Potential Profit</div>
                <div className="text-xl font-bold text-green-600">₹{potentialProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm font-medium text-gray-500">Potential Loss</div>
                <div className="text-xl font-bold text-red-600">₹{potentialLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="text-sm font-medium text-gray-500">Expected Value</div>
                <div className={`text-xl font-bold ${expectedValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{expectedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500 mt-1">Based on {winRate}% win rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk-Reward Visualization</h3>
        
        <div className="h-80">
          {riskRewardData.labels.length > 1 ? (
            <Line
              data={riskRewardData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: 'Price (₹)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Price Levels'
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ₹${value}`;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Enter entry, stop-loss, and take-profit prices to see visualization
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h4 className="font-medium text-blue-700 mb-2">Trading Guidelines</h4>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Aim for a risk-reward ratio of at least 1:2 for better long-term results</li>
            <li>Never risk more than 1-2% of your account on a single trade</li>
            <li>Always set stop-loss orders to protect your capital</li>
            <li>Consider expected value (win rate × potential profit - loss rate × potential loss) before entering a trade</li>
            <li>Adjust position size based on volatility and conviction level</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 