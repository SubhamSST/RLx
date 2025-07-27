import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function SWPCalculatorCard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [corpus, setCorpus] = useState("");
  const [returnRate, setReturnRate] = useState("");
  const [withdrawalPercent, setWithdrawalPercent] = useState("");
  const [inflation, setInflation] = useState("");
  const [result, setResult] = useState(null);

  const calculateSWP = () => {
    let corpusAmount = +corpus;
    let annualReturn = +returnRate / 100;
    let withdrawRate = +withdrawalPercent / 100;
    let inflationRate = +inflation / 100;

    let currentCorpus = corpusAmount;
    let currentWithdrawal = corpusAmount * withdrawRate;
    let years = 0;
    let maxYears = 200;

    while (currentCorpus > 0 && years < maxYears) {
      const interest = currentCorpus * annualReturn;
      currentCorpus = currentCorpus + interest - currentWithdrawal;

      if (currentWithdrawal > currentCorpus) break;

      currentWithdrawal *= 1 + inflationRate;
      years++;
    }

    if (years === maxYears) {
      const resultText = "Corpus will last forever and continue growing.";
      setResult(resultText);
      
      // Save calculation to history if user is logged in
      if (user) {
        const calculationData = {
          initialCorpus: +corpus,
          annualReturn: +returnRate,
          withdrawalRate: +withdrawalPercent,
          inflationRate: +inflation,
          result: resultText,
          years: "Indefinite"
        };
        
        const description = `SWP: ₹${parseFloat(corpus).toLocaleString()} corpus, ${withdrawalPercent}% withdrawal rate`;
        
        saveToHistory('swp', description, calculationData);
      }
    } else {
      const y = Math.floor(years);
      const resultText = `Corpus will last for ${y} years.`;
      setResult(resultText);
      
      // Save calculation to history if user is logged in
      if (user) {
        const calculationData = {
          initialCorpus: +corpus,
          annualReturn: +returnRate,
          withdrawalRate: +withdrawalPercent,
          inflationRate: +inflation,
          result: resultText,
          years: y
        };
        
        const description = `SWP: ₹${parseFloat(corpus).toLocaleString()} corpus will last ${y} years`;
        
        saveToHistory('swp', description, calculationData);
      }
    }
  };

  const viewAnalytics = () => {
    if (!result) return;

    const initialCorpus = parseFloat(corpus);
    const annualReturn = parseFloat(returnRate) / 100;
    const withdrawRate = parseFloat(withdrawalPercent) / 100;
    const inflationRate = parseFloat(inflation) / 100;

    const yearLabels = [];
    const corpusValues = [];
    const withdrawalValues = [];

    let currentCorpus = initialCorpus;
    let currentWithdrawal = initialCorpus * withdrawRate;
    let sustainabilityScore = 0;
    let maxYears = 30;

    const match = result.match(/\d+/);
    const yearsToSimulate = result.includes("forever")
      ? 30
      : match
      ? Math.min(parseInt(match[0]), 30)
      : 0;

    for (let i = 0; i <= yearsToSimulate; i++) {
      yearLabels.push(`Year ${i}`);
      corpusValues.push(currentCorpus);
      withdrawalValues.push(currentWithdrawal);

      if (i < yearsToSimulate) {
        const interest = currentCorpus * annualReturn;
        currentCorpus = currentCorpus + interest - currentWithdrawal;
        currentWithdrawal *= 1 + inflationRate;

        if (currentCorpus < 0) {
          currentCorpus = 0;
          break;
        }
      }
    }

    if (result.includes("forever")) {
      sustainabilityScore = 100;
    } else if (match) {
      const totalYears = parseInt(match[0]);
      sustainabilityScore = Math.min(Math.round((totalYears / 30) * 100), 99);
    }

    const analyticsData = {
      title: "Systematic Withdrawal Plan Analysis",
      description: `Analysis of SWP with ₹${initialCorpus.toLocaleString()} corpus at ${returnRate}% returns and ${withdrawalPercent}% withdrawal rate`,
      kpis: [
        {
          label: "Initial Corpus",
          value: `₹${initialCorpus.toLocaleString()}`
        },
        {
          label: "Monthly Withdrawal",
          value: `₹${(initialCorpus * withdrawRate / 12).toFixed(0)}`
        },
        {
          label: "Sustainability Score",
          value: `${sustainabilityScore}%`
        }
      ],
      mainChart: {
        title: "Corpus & Withdrawal Projection",
        data: [
          {
            x: yearLabels,
            y: corpusValues,
            type: "scatter",
            mode: "lines",
            name: "Corpus Value",
            line: { color: "#38A169" }
          },
          {
            x: yearLabels,
            y: withdrawalValues.map(w => w * 12),
            type: "bar",
            name: "Annual Withdrawal",
            marker: { color: "#48BB78" }
          }
        ],
        layout: {
          xaxis: { title: "Year" },
          yaxis: { title: "Amount (₹)" }
        }
      },
      secondaryCharts: [
        {
          title: "Withdrawal Growth Due to Inflation",
          data: [
            {
              x: yearLabels,
              y: withdrawalValues,
              type: "scatter",
              mode: "lines+markers",
              name: "Monthly Withdrawal",
              line: { color: "#9AE6B4" },
              marker: { color: "#68D391" }
            }
          ],
          layout: {
            xaxis: { title: "Year" },
            yaxis: { title: "Monthly Withdrawal (₹)" }
          }
        }
      ]
    };

    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div className="bg-[#121212] text-white p-8 rounded-xl shadow-md w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-green-400">Sustainable SWP Calculator</h2>
      <div className="space-y-3">
        <input
          type="number"
          placeholder="Corpus (e.g. 10000000)"
          value={corpus}
          onChange={(e) => setCorpus(e.target.value)}
          className="w-full p-2 bg-black border border-gray-600 rounded"
        />
        <input
          type="number"
          placeholder="Annual Return (%) e.g. 16"
          value={returnRate}
          onChange={(e) => setReturnRate(e.target.value)}
          className="w-full p-2 bg-black border border-gray-600 rounded"
        />
        <input
          type="number"
          placeholder="Withdrawal % (e.g. 10)"
          value={withdrawalPercent}
          onChange={(e) => setWithdrawalPercent(e.target.value)}
          className="w-full p-2 bg-black border border-gray-600 rounded"
        />
        <input
          type="number"
          placeholder="Inflation Rate (%) e.g. 6"
          value={inflation}
          onChange={(e) => setInflation(e.target.value)}
          className="w-full p-2 bg-black border border-gray-600 rounded"
        />

        <button
          onClick={calculateSWP}
          className="w-full bg-green-400 text-black py-2 rounded font-semibold"
        >
          Calculate
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-800 rounded text-center text-lg text-green-300">
            {result}
            <button
              onClick={viewAnalytics}
              className="mt-3 block w-full bg-transparent border border-green-400 text-green-400 px-4 py-1.5 rounded hover:bg-green-400 hover:text-black transition-colors text-base"
            >
              View Analytics
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SWPCalculatorCard;
