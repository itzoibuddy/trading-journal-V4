import { Chart, registerables } from 'chart.js';

// Register all Chart.js components including the Filler plugin
Chart.register(...registerables);

export default Chart; 