import React, { useState, useEffect } from 'react';
import './App.css';

interface CarbonLog {
  category: string;
  value: number;
  date: string;
  details?: Record<string, any>;
}

interface Insight {
  type: string;
  title: string;
  severity: 'info' | 'warning' | 'success';
  content: string;
  value: number;
}

const API_BASE = 'http://localhost:8000/api/v1';

// Constants for comparison
const TARGET_YEARLY_BUDGET = 2000; // Target maximum carbon footprint in kg CO2e per individual annually (2 tonnes)
const GLOBAL_AVERAGE = 4000; // Global average carbon footprint in kg CO2e (4 tonnes)

function App() {
  const [logs, setLogs] = useState<CarbonLog[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Form & Wizard states
  const [logCategory, setLogCategory] = useState<string>('Transportation');
  const [logValue, setLogValue] = useState<string>('');
  
  // Wizard variables
  const [wizardMode, setWizardMode] = useState<boolean>(false);
  const [wizardMiles, setWizardMiles] = useState<string>('');
  const [wizardKwh, setWizardKwh] = useState<string>('');
  const [wizardMeals, setWizardMeals] = useState<string>('');
  const [wizardTrash, setWizardTrash] = useState<string>('');

  // Fetch logs and insights
  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, insightsRes] = await Promise.all([
        fetch(`${API_BASE}/carbon/logs`),
        fetch(`${API_BASE}/carbon/insights`)
      ]);

      if (logsRes.ok && insightsRes.ok) {
        const logsData = await logsRes.json();
        const insightsData = await insightsRes.json();
        setLogs(logsData);
        setInsights(insightsData.insights);
      } else {
        throw new Error('API server error, falling back to local storage');
      }
    } catch (error) {
      console.warn('Backend offline, using localStorage:', error);
      const localLogs = localStorage.getItem('carbon_logs');
      if (localLogs) {
        const parsed = JSON.parse(localLogs);
        setLogs(parsed);
        calculateLocalInsights(parsed);
      } else {
        const defaultLogs = [
          { category: 'Transportation', value: 12.4, date: '2026-06-08' },
          { category: 'Energy', value: 8.2, date: '2026-06-07' },
        ];
        setLogs(defaultLogs);
        localStorage.setItem('carbon_logs', JSON.stringify(defaultLogs));
        calculateLocalInsights(defaultLogs);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalInsights = (currentLogs: CarbonLog[]) => {
    const categories: Record<string, number> = {};
    currentLogs.forEach(log => {
      categories[log.category] = (categories[log.category] || 0) + log.value;
    });

    const localInsights: Insight[] = [
      {
        type: 'transit',
        title: 'Transit Suggestion',
        severity: (categories['Transportation'] || 0) > 10 ? 'info' : 'success',
        content: (categories['Transportation'] || 0) > 10
          ? `Transportation accounts for ${(categories['Transportation'] || 0).toFixed(1)} kg CO2e. Switching 15km of driving to public transit saves 4.2kg CO2e.`
          : 'Your transportation footprint is low! Consider walking or cycling to maintain this excellent baseline.',
        value: (categories['Transportation'] || 0) > 10 ? 4.2 : 0
      },
      {
        type: 'energy',
        title: 'Energy Efficiency',
        severity: (categories['Energy'] || 0) > 5 ? 'warning' : 'success',
        content: (categories['Energy'] || 0) > 5
          ? `Energy usage has reached ${(categories['Energy'] || 0).toFixed(1)} kg CO2e. Enabling power-saver cycles can reduce total usage by up to 8% today.`
          : 'Excellent energy management. Turn off unused electronics to save even more power.',
        value: (categories['Energy'] || 0) > 5 ? 1.5 : 0
      },
      {
        type: 'food',
        title: 'Dietary Action',
        severity: (categories['Food'] || 0) > 3 ? 'info' : 'success',
        content: (categories['Food'] || 0) > 3
          ? 'Opting for 2 meat-free days weekly will lower your dietary emissions trace by approximately 18% monthly.'
          : 'Keep up the eco-friendly food habits! Buying local organic produce further minimizes footprint.',
        value: (categories['Food'] || 0) > 3 ? 2.1 : 0
      }
    ];
    setInsights(localInsights);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotal = () => {
    return logs.reduce((acc, log) => acc + log.value, 0);
  };

  const totalEmissions = calculateTotal();
  // Percentage of Yearly target budget (2000 kg)
  const targetPercent = ((totalEmissions / TARGET_YEARLY_BUDGET) * 100).toFixed(1);
  // Percentage of Global Average footprint (4000 kg)
  const globalAveragePercent = ((totalEmissions / GLOBAL_AVERAGE) * 100).toFixed(1);

  // Handle addition of a log
  const handleAddLog = async (category: string, value: number, details: Record<string, any> = {}) => {
    const newLogItem = {
      category,
      value,
      details,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const response = await fetch(`${API_BASE}/carbon/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, value, details })
      });
      if (response.ok) {
        // Refresh from backend
        fetchData();
        setStatusMessage(`Successfully logged ${value} kg for ${category}`);
      } else {
        throw new Error('API server rejected submission');
      }
    } catch (e) {
      // Offline fallback
      const updated = [newLogItem, ...logs];
      setLogs(updated);
      localStorage.setItem('carbon_logs', JSON.stringify(updated));
      calculateLocalInsights(updated);
      setStatusMessage(`Locally logged ${value} kg for ${category}`);
    }

    // Clear message after 3 seconds
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Standard Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVal = parseFloat(logValue);
    if (isNaN(parsedVal) || parsedVal <= 0) return;
    handleAddLog(logCategory, parsedVal);
    setLogValue('');
  };

  // Calculator Wizard execution
  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let calculatedVal = 0;
    const detailsObj: Record<string, any> = {};

    if (wizardMiles && !isNaN(Number(wizardMiles))) {
      const miles = parseFloat(wizardMiles);
      calculatedVal += miles * 0.40; // 0.40 kg CO2e per mile for typical car
      detailsObj.miles = miles;
    }
    if (wizardKwh && !isNaN(Number(wizardKwh))) {
      const kwh = parseFloat(wizardKwh);
      calculatedVal += kwh * 0.38; // 0.38 kg CO2e per kWh
      detailsObj.kwh = kwh;
    }
    if (wizardMeals && !isNaN(Number(wizardMeals))) {
      const meals = parseFloat(wizardMeals);
      calculatedVal += meals * 2.5; // Average meat meal: 2.5 kg CO2e
      detailsObj.meals = meals;
    }
    if (wizardTrash && !isNaN(Number(wizardTrash))) {
      const bags = parseFloat(wizardTrash);
      calculatedVal += bags * 1.2; // Average bag of trash: 1.2 kg CO2e
      detailsObj.bags = bags;
    }

    if (calculatedVal > 0) {
      handleAddLog('Calculated Activity', parseFloat(calculatedVal.toFixed(1)), detailsObj);
      setWizardMiles('');
      setWizardKwh('');
      setWizardMeals('');
      setWizardTrash('');
      setWizardMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 font-sans selection:bg-emerald-600 selection:text-white relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-950/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-sky-950/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Screen Reader Announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>

      <header className="border-b border-gray-800 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-2xl" aria-hidden="true">
              🍃
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                EcoAudit <span className="text-emerald-400 font-medium">Carbon Tracker</span>
              </h1>
              <p className="text-xs text-gray-400">Non-profit personal footprint assessment & insight system</p>
            </div>
          </div>
          <nav aria-label="Main Navigation">
            <ul className="flex gap-4">
              <li>
                <a 
                  href="#metrics-dashboard" 
                  className="text-sm text-gray-300 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#07090e] rounded px-2 py-1 transition-colors"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  href="#tracking-form" 
                  className="text-sm text-gray-300 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#07090e] rounded px-2 py-1 transition-colors"
                >
                  Log Emissions
                </a>
              </li>
              <li>
                <a 
                  href="#insights-panel" 
                  className="text-sm text-gray-300 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#07090e] rounded px-2 py-1 transition-colors"
                >
                  Action Insights
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-12">
        {/* HERO SECTION / INTRO */}
        <section className="text-center max-w-3xl mx-auto space-y-4" aria-labelledby="intro-heading">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Empowering Personal Climate Actions
          </span>
          <h2 id="intro-heading" className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
            Understand and Reduce Your Footprint
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Track daily emissions, convert your everyday actions into measurable carbon values with our interactive wizard, and discover tailored micro-adjustments to lighten your environmental impact.
          </p>
        </section>

        {/* METRICS DASHBOARD SECTION */}
        <section id="metrics-dashboard" aria-labelledby="metrics-heading" className="space-y-6">
          <h3 id="metrics-heading" className="text-xl font-bold text-white border-l-4 border-emerald-500 pl-3">
            Your Climate Impact Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Total emissions card */}
            <div className="p-8 bg-gradient-to-br from-emerald-950/25 to-gray-900 border border-emerald-500/20 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Total Carbon Tracked</h4>
                <p className="text-5xl font-extrabold text-white tracking-tight flex items-baseline">
                  {totalEmissions.toFixed(1)}
                  <span className="text-sm font-medium text-gray-400 ml-2">kg CO2e</span>
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                The total calculated carbon emissions based on all your logged actions and activities.
              </p>
            </div>

            {/* Target yearly budget card */}
            <div className="p-8 bg-gradient-to-br from-blue-950/25 to-gray-900 border border-blue-500/20 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Individual Target Percent</h4>
                <p className="text-5xl font-extrabold text-sky-400 tracking-tight">
                  {targetPercent}%
                </p>
                <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-sky-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(parseFloat(targetPercent), 100)}%` }}
                    role="progressbar"
                    aria-valuenow={parseFloat(targetPercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Target budget usage percentage"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                Compared to an target sustainable limit of <strong>{TARGET_YEARLY_BUDGET} kg</strong> CO2e per year.
              </p>
            </div>

            {/* Global average comparison card */}
            <div className="p-8 bg-gradient-to-br from-indigo-950/25 to-gray-900 border border-indigo-500/20 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Global Average Ratio</h4>
                <p className="text-5xl font-extrabold text-indigo-400 tracking-tight">
                  {globalAveragePercent}%
                </p>
                <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(parseFloat(globalAveragePercent), 100)}%` }}
                    role="progressbar"
                    aria-valuenow={parseFloat(globalAveragePercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Global average ratio usage percentage"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                Compared to the average global carbon footprint of <strong>{GLOBAL_AVERAGE} kg</strong> CO2e per person.
              </p>
            </div>

          </div>
        </section>

        {/* TRACKING & CALCULATOR FORMS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <section id="tracking-form" aria-labelledby="logging-heading" className="p-8 bg-[#0b0f19] border border-gray-800 rounded-2xl space-y-6 shadow-md">
            <div className="flex justify-between items-center">
              <h3 id="logging-heading" className="text-xl font-bold text-white">
                {wizardMode ? '⚡ Calculation Wizard' : '✍️ Log Carbon Footprint'}
              </h3>
              <button
                onClick={() => setWizardMode(!wizardMode)}
                className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19] transition-all"
                aria-pressed={wizardMode}
              >
                {wizardMode ? 'Switch to Manual Input' : 'Use Calculator Helper'}
              </button>
            </div>

            {wizardMode ? (
              /* Interactive Wizard Calculation Helper */
              <form onSubmit={handleWizardSubmit} className="space-y-5">
                <p className="text-xs text-gray-400">
                  Enter estimates of your activities. We will apply standardized emission calculations to establish the total CO2e.
                </p>

                <div className="space-y-2">
                  <label htmlFor="wizard-miles" className="block text-xs font-semibold text-gray-300">
                    Distance Driven (Miles) - <span className="text-gray-500">~0.40 kg/mi</span>
                  </label>
                  <input
                    id="wizard-miles"
                    type="number"
                    step="any"
                    placeholder="e.g. 25"
                    value={wizardMiles}
                    onChange={(e) => setWizardMiles(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="wizard-kwh" className="block text-xs font-semibold text-gray-300">
                    Electricity Consumed (kWh) - <span className="text-gray-500">~0.38 kg/kWh</span>
                  </label>
                  <input
                    id="wizard-kwh"
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={wizardKwh}
                    onChange={(e) => setWizardKwh(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="wizard-meals" className="block text-xs font-semibold text-gray-300">
                    Meat/Animal Meals Eaten - <span className="text-gray-500">~2.50 kg/meal</span>
                  </label>
                  <input
                    id="wizard-meals"
                    type="number"
                    step="1"
                    placeholder="e.g. 2"
                    value={wizardMeals}
                    onChange={(e) => setWizardMeals(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="wizard-trash" className="block text-xs font-semibold text-gray-300">
                    Standard Trash Bags Filled - <span className="text-gray-500">~1.20 kg/bag</span>
                  </label>
                  <input
                    id="wizard-trash"
                    type="number"
                    step="1"
                    placeholder="e.g. 1"
                    value={wizardTrash}
                    onChange={(e) => setWizardTrash(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19]"
                >
                  Calculate & Log Emissions
                </button>
              </form>
            ) : (
              /* Standard Manual Entry Form */
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="log-category" className="block text-xs font-semibold text-gray-300">
                    Activity Category
                  </label>
                  <select
                    id="log-category"
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  >
                    <option value="Transportation">Transportation</option>
                    <option value="Energy">Energy</option>
                    <option value="Food">Food</option>
                    <option value="Waste">Waste</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="log-value" className="block text-xs font-semibold text-gray-300">
                    Emissions (kg CO2e)
                  </label>
                  <input
                    id="log-value"
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 15.2"
                    value={logValue}
                    onChange={(e) => setLogValue(e.target.value)}
                    className="w-full bg-[#121824] border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19]"
                >
                  Log Footprint Action
                </button>
              </form>
            )}
          </section>

          {/* HISTORICAL LOG FEED PANEL */}
          <section aria-labelledby="history-heading" className="p-8 bg-[#0b0f19] border border-gray-800 rounded-2xl space-y-6 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <h3 id="history-heading" className="text-xl font-bold text-white">
                Recent Footprint Log
              </h3>
              
              {loading ? (
                <div className="py-12 text-center text-gray-500" aria-live="polite">Loading tracking entries...</div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-gray-500" aria-live="polite">No footprint logs recorded yet.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2" role="log">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-3.5 bg-[#121824] border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 block">{log.date}</span>
                        <span className="text-sm font-semibold text-white">{log.category}</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold" aria-label={`${log.value} kilograms of CO2 equivalents`}>
                        +{log.value.toFixed(1)} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 pt-4 mt-6">
              <button 
                onClick={fetchData} 
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0b0f19] transition-all"
              >
                Sync with Server
              </button>
            </div>
          </section>

        </div>

        {/* INSIGHTS & ACTIONS PANEL */}
        <section id="insights-panel" aria-labelledby="insights-heading" className="space-y-6">
          <h3 id="insights-heading" className="text-xl font-bold text-white border-l-4 border-emerald-500 pl-3">
            Personalized Footprint Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              let alertClass = "bg-[#121c16] border-emerald-500/20 text-emerald-400";
              let titleIcon = "🥗";
              
              if (insight.type === 'transit') {
                alertClass = "bg-[#101928] border-sky-500/20 text-sky-400";
                titleIcon = "💡";
              } else if (insight.type === 'energy') {
                alertClass = "bg-[#1c1610] border-amber-500/20 text-amber-400";
                titleIcon = "⚡";
              }

              return (
                <article 
                  key={index} 
                  className={`p-6 border rounded-2xl flex flex-col justify-between ${alertClass} shadow-sm`}
                >
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <span aria-hidden="true">{titleIcon}</span> {insight.title}
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {insight.content}
                    </p>
                  </div>
                  {insight.value > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Potential Saving</span>
                      <span className="text-xs font-bold text-emerald-400">{insight.value} kg CO2e</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* EDUCATION HUB */}
        <section aria-labelledby="edu-heading" className="p-8 bg-[#0b0f19] border border-gray-800 rounded-2xl space-y-4">
          <h3 id="edu-heading" className="text-xl font-bold text-white">
            Understanding Carbon Footprints
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            A carbon footprint is the total amount of greenhouse gases (including carbon dioxide and methane) that are generated by our actions. Globally, the average carbon footprint is closer to 4 tons. To have the best chance of avoiding a 2℃ rise in global temperatures, the average global carbon footprint per year needs to drop to under 2 tons by 2050. Lowering individual footprints can start with simple daily shifts like eating less red meat, utilizing energy efficient appliances, and opting for active transportation.
          </p>
        </section>

      </main>

      <footer className="border-t border-gray-800 bg-[#06080d] py-8 px-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>&copy; 2026 EcoAudit Carbon Assessment Platform. Developed as a non-profit initiative.</p>
          <p>Committed to Universal Web Accessibility & Climate Change Action.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
