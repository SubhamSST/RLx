import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function SipCalculatorCard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [monthlyInvestment, setMonthlyInvestment] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [years, setYears] = useState("");
  const [adjusted, setAdjusted] = useState(false);
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpPercent, setStepUpPercent] = useState("10");
  const [stepUpFrequency, setStepUpFrequency] = useState("12");
  const [result, setResult] = useState(null);

  const calculateSIP = () => {
    const P = parseFloat(monthlyInvestment);
    const r = parseFloat(annualRate) / 12 / 100;
    const n = parseInt(years) * 12;
    const t = parseInt(years);
    const g = stepUpEnabled ? parseFloat(stepUpPercent) / 100 : 0;
    const freq = stepUpEnabled ? parseInt(stepUpFrequency) : 0;

    if (isNaN(P) || isNaN(r) || isNaN(n) || (stepUpEnabled && (isNaN(g) || isNaN(freq) || freq <= 0))) return;

    let fv = 0;

    for (let month = 0; month < n; month++) {
      const stepMultiplier = stepUpEnabled ? Math.floor(month / freq) : 0;
      const currentSIP = P * Math.pow(1 + g, stepMultiplier);
      fv += currentSIP * Math.pow(1 + r, n - month);
    }

    if (adjusted) {
      const inflationRate = 0.06;
      fv /= Math.pow(1 + inflationRate, t);
    }

    const finalResult = fv.toFixed(2);
    setResult(finalResult);
    
    // Save calculation to history if user is logged in
    if (user) {
      const calculationData = {
        monthlyInvestment: P,
        annualRate: parseFloat(annualRate),
        years: t,
        inflationAdjusted: adjusted,
        stepUp: stepUpEnabled,
        stepUpPercent: stepUpEnabled ? parseFloat(stepUpPercent) : null,
        stepUpFrequency: stepUpEnabled ? freq : null,
        result: parseFloat(finalResult)
      };
      
      const description = `SIP: ₹${P} monthly for ${t} years at ${annualRate}%${stepUpEnabled ? ` with ${stepUpPercent}% step-up` : ''}`;
      
      saveToHistory('sip', description, calculationData);
    }
  };

  const viewAnalytics = () => {
    if (!result) return;

    const P = parseFloat(monthlyInvestment);
    const r = parseFloat(annualRate) / 12 / 100;
    const n = parseInt(years) * 12;
    const t = parseInt(years);
    const g = stepUpEnabled ? parseFloat(stepUpPercent) / 100 : 0;
    const freq = stepUpEnabled ? parseInt(stepUpFrequency) : 0;
    const inflationRate = 0.06;
    const yourSIP = parseFloat(result);

    const calculateFV = (rate) => {
      const monthlyRate = rate / 12;
      return P * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate);
    };

    let bankFD = calculateFV(0.06);
    let debt = calculateFV(0.08);
    let equity = calculateFV(0.12);

    if (adjusted) {
      const inflationDivisor = Math.pow(1 + inflationRate, t);
      bankFD /= inflationDivisor;
      debt /= inflationDivisor;
      equity /= inflationDivisor;
    }

    const yearlyData = [];
    const investedAmount = [];
    const expectedReturns = [];

    for (let i = 1; i <= t; i++) {
      const monthsCompleted = i * 12;
      let invested = 0;
      let futureValue = 0;

      for (let j = 0; j < monthsCompleted; j++) {
        const stepMultiplier = stepUpEnabled ? Math.floor(j / freq) : 0;
        const currentSIP = P * Math.pow(1 + g, stepMultiplier);
        invested += currentSIP;
        futureValue += currentSIP * Math.pow(1 + r, monthsCompleted - j);
      }

      yearlyData.push(`Year ${i}`);
      investedAmount.push(invested);
      expectedReturns.push(adjusted ? futureValue / Math.pow(1 + inflationRate, i) : futureValue);
    }

    const totalInvested = investedAmount[investedAmount.length - 1];
    const totalReturns = yourSIP - totalInvested;

    const analyticsData = {
      title: "SIP Investment Analysis",
      description: `Analysis of a ${years}-year SIP${stepUpEnabled ? " with Step-Up" : ""} at ${annualRate}% return${adjusted ? " (inflation adjusted)" : ""}`,
      kpis: [
        {
          label: "Initial Monthly Investment",
          value: `₹${parseFloat(monthlyInvestment).toLocaleString()}`
        },
        {
          label: "Total Investment",
          value: `₹${totalInvested.toLocaleString()}`
        },
        {
          label: adjusted ? "Adjusted Returns" : "Expected Returns",
          value: `₹${parseFloat(yourSIP).toLocaleString()}`,
          change: 12
        }
      ],
      mainChart: {
        title: "Investment Growth Over Time",
        data: [
          {
            x: yearlyData,
            y: expectedReturns,
            type: "scatter",
            mode: "lines+markers",
            name: "Total Value",
            line: { color: "#10B981" },
            marker: { color: "#10B981" }
          },
          {
            x: yearlyData,
            y: investedAmount,
            type: "scatter",
            mode: "lines+markers",
            name: "Amount Invested",
            line: { color: "#6EE7B7" },
            marker: { color: "#6EE7B7" }
          }
        ],
        layout: {
          xaxis: { title: "Time Period" },
          yaxis: { title: "Amount (₹)" }
        }
      },
      secondaryCharts: [
        {
          title: "Investment Breakdown",
          data: [
            {
              type: "pie",
              labels: ["Amount Invested", "Wealth Gained"],
              values: [totalInvested, totalReturns > 0 ? totalReturns : 0],
              marker: {
                colors: ["#6EE7B7", "#10B981"]
              }
            }
          ],
          showLegend: true
        },
        {
          title: "Returns Comparison",
          data: [
            {
              type: "bar",
              x: ["Bank FD (6%)", "Debt (8%)", "Your SIP", "Equity (12%)"],
              y: [bankFD, debt, yourSIP, equity],
              marker: {
                color: ["#CBD5E0", "#A0AEC0", "#10B981", "#047857"]
              }
            }
          ],
          layout: {
            yaxis: { title: "Final Amount (₹)" }
          }
        }
      ]
    };

    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div className="card bg-[#1a1a1a] p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:-rotate-1">
      <h2 className="text-2xl font-bold mb-4 text-green-300">SIP Calculator</h2>
      <div className="flex flex-col gap-3 mb-4">
        <input
          type="number"
          placeholder="Monthly Investment (₹)"
          value={monthlyInvestment}
          onChange={(e) => setMonthlyInvestment(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <input
          type="number"
          placeholder="Expected Annual Return (%)"
          value={annualRate}
          onChange={(e) => setAnnualRate(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <input
          type="number"
          placeholder="Investment Duration (Years)"
          value={years}
          onChange={(e) => setYears(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />

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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="stepUp"
            checked={stepUpEnabled}
            onChange={() => setStepUpEnabled(!stepUpEnabled)}
          />
          <label htmlFor="stepUp" className="text-sm text-gray-300">
            Enable Step-Up SIP
          </label>
        </div>

        {stepUpEnabled && (
          <>
            <input
              type="number"
              placeholder="Step-Up % (e.g. 10)"
              value={stepUpPercent}
              onChange={(e) => setStepUpPercent(e.target.value)}
              className="p-2 rounded bg-black border border-gray-600 text-white"
            />
            <input
              type="number"
              placeholder="Step-Up Frequency (months)"
              value={stepUpFrequency}
              onChange={(e) => setStepUpFrequency(e.target.value)}
              className="p-2 rounded bg-black border border-gray-600 text-white"
            />
          </>
        )}

        <button
          onClick={calculateSIP}
          className="bg-green-400 text-black px-5 py-2 rounded-lg font-semibold"
        >
          Calculate
        </button>
      </div>

      {result && (
        <div className="mt-4 text-white">
          <p className="text-lg">
            {adjusted ? "Inflation Adjusted Return:" : "Estimated Future Value:"}
          </p>
          <p className="text-xl font-bold text-green-300">
            ₹ {parseFloat(result).toLocaleString('en-IN')}
          </p>
          <button
            onClick={viewAnalytics}
            className="mt-3 bg-transparent border border-green-400 text-green-400 px-4 py-1.5 rounded hover:bg-green-400 hover:text-black transition-colors"
          >
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
}

export default SipCalculatorCard;


