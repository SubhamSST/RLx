import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function LumpsumCalculatorCard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [adjusted, setAdjusted] = useState(false);
  const [result, setResult] = useState(null);

  const calculateLumpsum = () => {
    let r = rate / 100;

    if (adjusted) r -= 0.06; // subtract inflation from growth

    const futureValue = amount * Math.pow(1 + r, years);
    setResult(futureValue);
    
    // Save calculation to history if user is logged in
    if (user) {
      const calculationData = {
        initialAmount: parseFloat(amount),
        interestRate: parseFloat(rate),
        years: parseInt(years),
        inflationAdjusted: adjusted,
        result: futureValue
      };
      
      const description = `Lumpsum: ₹${parseFloat(amount).toLocaleString()} at ${rate}% for ${years} years`;
      
      saveToHistory('lumpsum', description, calculationData);
    }
  };

  const viewAnalytics = () => {
    if (!result) return;
    
    const initialAmount = parseFloat(amount);
    const interestRate = parseFloat(rate) / 100;
    const investmentYears = parseInt(years);
    
    // Calculate yearly breakdown for chart
    const yearlyData = [];
    const investmentGrowth = [];
    const yearlyReturns = [];
    
    let currentValue = initialAmount;
    for (let i = 1; i <= investmentYears; i++) {
      const yearStart = currentValue;
      currentValue = initialAmount * Math.pow(1 + interestRate, i);
      const yearlyReturn = currentValue - yearStart;
      
      yearlyData.push(`Year ${i}`);
      investmentGrowth.push(currentValue);
      yearlyReturns.push(yearlyReturn);
    }
    
    const totalReturns = result - initialAmount;
    const annualizedReturn = (Math.pow(result / initialAmount, 1 / investmentYears) - 1) * 100;
    
    // Prepare data for analytics page
    const analyticsData = {
      title: "Lumpsum Investment Analysis",
      description: `Analysis of a ${investmentYears}-year lumpsum investment at ${rate}% annual return${adjusted ? " (inflation adjusted)" : ""}`,
      kpis: [
        { 
          label: "Initial Investment", 
          value: `₹${initialAmount.toLocaleString()}`
        },
        { 
          label: "Final Amount", 
          value: `₹${result.toFixed(2)}`,
          change: annualizedReturn.toFixed(1)
        },
        { 
          label: "Total Returns", 
          value: `₹${totalReturns.toFixed(2)}`
        }
      ],
      mainChart: {
        title: "Investment Growth Over Time",
        data: [
          {
            x: yearlyData,
            y: investmentGrowth,
            type: "scatter",
            mode: "lines+markers",
            name: "Investment Value",
            line: { color: "#9F7AEA" },
            marker: { color: "#9F7AEA" }
          }
        ],
        layout: {
          xaxis: { title: "Year" },
          yaxis: { title: "Amount (₹)" }
        }
      },
      secondaryCharts: [
        {
          title: "Investment Breakdown",
          data: [
            {
              type: "pie",
              labels: ["Principal Amount", "Total Returns"],
              values: [initialAmount, totalReturns],
              marker: {
                colors: ["#D6BCFA", "#9F7AEA"]
              }
            }
          ],
          showLegend: true
        },
        {
          title: "Yearly Returns",
          data: [
            {
              type: "bar",
              x: yearlyData,
              y: yearlyReturns,
              marker: { color: "#805AD5" }
            }
          ],
          layout: {
            xaxis: { title: "Year" },
            yaxis: { title: "Returns (₹)" }
          }
        }
      ]
    };
    
    // Navigate to analytics page with data
    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div className="card bg-[#1a1a1a] p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:-rotate-1">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">Lumpsum Calculator</h2>
      <div className="flex flex-col gap-3 mb-4">
        <input type="number" placeholder="Initial Investment" value={amount} onChange={(e) => setAmount(+e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input type="number" placeholder="Annual Return Rate (%)" value={rate} onChange={(e) => setRate(+e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input type="number" placeholder="Years" value={years} onChange={(e) => setYears(+e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <button onClick={calculateLumpsum} className="bg-purple-400 text-black px-5 py-2 rounded-lg font-semibold">
          Calculate
        </button>
      <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="adjustInflation"
            checked={adjusted}
            onChange={() => setAdjusted(!adjusted)}
          />
          <label htmlFor="adjustInflation" className="text-sm text-gray-300">
            Adjust for 6% Inflation
          </label>
        </div>
      </div>
      {result && (
        <div className="mt-4 text-white">
          <p className="text-lg">Final Value: ₹{result.toFixed(2)}</p>
          {adjusted && <p className="text-sm text-gray-400">(Adjusted to today's value)</p>}
          <button 
            onClick={viewAnalytics}
            className="mt-3 bg-transparent border border-purple-400 text-purple-400 px-4 py-1.5 rounded hover:bg-purple-400 hover:text-black transition-colors"
          >
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
}

export default LumpsumCalculatorCard;
