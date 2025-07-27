// src/components/LoanAffordabilityCalculator.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function LoanAffordabilityCalculator() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [currentEmi, setCurrentEmi] = useState("");
  const [result, setResult] = useState(null);
  const [animate, setAnimate] = useState(false);

  const DTI_LIMIT = 0.4; // 40% safe debt-to-income ratio

   useEffect(() => {
    const timeout = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleCalculate = () => {
    const income = parseFloat(monthlyIncome);
    const emi = parseFloat(currentEmi);

    if (isNaN(income) || isNaN(emi)) {
      setResult(null);
      return;
    }

    const maxEmi = income * DTI_LIMIT;
    const room = maxEmi - emi;

    let message = "";
    if (room > 3000) {
      message = "✅ You're within the safe EMI limit.";
    } else if (room >= 0) {
      message = "⚠️ Caution! You're approaching your EMI limit.";
    } else {
      message = "❌ You've exceeded the recommended EMI threshold.";
    }

    setResult({ maxEmi, currentEmi: emi, room, message });
    
    // Save calculation to history if user is logged in
    if (user) {
      const calculationData = {
        monthlyIncome: income,
        currentEmi: emi,
        maxEmi,
        room,
        message,
        dtiLimit: DTI_LIMIT,
        result: room,
        currentDTI: (emi / income) * 100
      };
      
      const description = `Loan Affordability: ₹${room.toLocaleString()} EMI room with ₹${income.toLocaleString()} income`;
      
      saveToHistory('loan_affordability', description, calculationData);
    }
  };
  
  const viewAnalytics = () => {
    if (!result) return;
    
    const income = parseFloat(monthlyIncome);
    const emi = parseFloat(currentEmi);
    const maxEmi = income * DTI_LIMIT;
    const room = maxEmi - emi;
    
    // Calculate debt-to-income ratio
    const currentDTI = (emi / income) * 100;
    
    // Generate scenarios for different incomes
    const incomeScenarios = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];
    const scenarioLabels = incomeScenarios.map(factor => `${(factor * 100).toFixed(0)}%`);
    const maxEmiScenarios = incomeScenarios.map(factor => income * factor * DTI_LIMIT);
    const roomScenarios = maxEmiScenarios.map(maxEmi => maxEmi - emi);
    
    // Calculate EMI room for different loan types
    const loanTypes = ["Personal Loan", "Home Loan", "Car Loan", "Education Loan"];
    const typicalInterestRates = [0.14, 0.09, 0.11, 0.10]; // 14%, 9%, 11%, 10%
    const tenures = [5, 20, 7, 10]; // years
    
    const monthlyPaymentForLakh = typicalInterestRates.map((rate, i) => {
      const monthlyRate = rate / 12;
      const totalPayments = tenures[i] * 12;
      return (100000 * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
             (Math.pow(1 + monthlyRate, totalPayments) - 1);
    });
    
    const affordableLoanAmounts = monthlyPaymentForLakh.map(emiPerLakh => 
      Math.max(0, room) * 100000 / emiPerLakh
    );
    
    // Prepare data for analytics page
    const analyticsData = {
      title: "Loan Affordability Analysis",
      description: `Analysis of loan affordability based on monthly income of ₹${income.toLocaleString()} and current EMIs of ₹${emi.toLocaleString()}`,
      kpis: [
        { 
          label: "Current DTI Ratio", 
          value: `${currentDTI.toFixed(1)}%`,
          change: currentDTI - (DTI_LIMIT * 100)
        },
        { 
          label: "Max Safe EMI", 
          value: `₹${maxEmi.toFixed(0)}`
        },
        { 
          label: "Available EMI Room", 
          value: `₹${Math.max(0, room).toFixed(0)}`
        }
      ],
      mainChart: {
        title: "EMI Capacity by Income Level",
        data: [
          {
            type: "bar",
            x: scenarioLabels,
            y: maxEmiScenarios,
            name: "Max EMI Capacity",
            marker: { color: "#F6AD55" }
          },
          {
            type: "scatter",
            x: scenarioLabels,
            y: Array(incomeScenarios.length).fill(emi),
            mode: "lines",
            name: "Current EMI",
            line: { color: "#F56565", dash: "dash" }
          }
        ],
        layout: {
          yaxis: { title: "EMI Amount (₹)" }
        }
      },
      secondaryCharts: [
        {
          title: "Affordable Loan Amount by Type",
          data: [
            {
              type: "bar",
              x: loanTypes,
              y: affordableLoanAmounts,
              marker: { color: "#4299E1" }
            }
          ],
          layout: {
            yaxis: { title: "Loan Amount (₹)" }
          }
        },
        {
          title: "EMI Budget Breakdown",
          data: [
            {
              type: "pie",
              labels: ["Current EMIs", "Available EMI Capacity", "Rest of Income"],
              values: [emi, Math.max(0, room), income - maxEmi],
              marker: {
                colors: ["#F56565", "#68D391", "#4299E1"]
              }
            }
          ],
          showLegend: true
        }
      ]
    };
    
    // Navigate to analytics page with data
    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div
      className={`rounded-xl p-6 bg-[#1a1a1a] text-white shadow-xl transform transition-all duration-700 hover:scale-105 hover:-rotate-1 ${
        animate ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
      }`}
    >
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Loan Affordability</h2>

      <div className="flex flex-col gap-4">
        <input
          type="number"
          placeholder="Monthly Income (₹)"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <input
          type="number"
          placeholder="Current Total EMIs (₹)"
          value={currentEmi}
          onChange={(e) => setCurrentEmi(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <button
          onClick={handleCalculate}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 px-4 rounded transition"
        >
          Calculate
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-2 text-sm text-gray-300">
          <p>
            Max Safe EMI (40% of Income):{" "}
            <span className="text-green-400 font-bold">₹{result.maxEmi.toFixed(0)}</span>
          </p>
          <p>
            Current EMI Load:{" "}
            <span className="text-red-400 font-bold">₹{result.currentEmi.toFixed(0)}</span>
          </p>
          <p>
            Remaining EMI Room:{" "}
            <span className={`font-bold ${result.room > 0 ? "text-blue-400" : "text-red-500"}`}>
              ₹{Math.max(0, result.room).toFixed(0)}
            </span>
          </p>
          <p className="text-yellow-300 mt-2">{result.message}</p>
          <button 
            onClick={viewAnalytics}
            className="mt-3 bg-transparent border border-yellow-400 text-yellow-400 px-4 py-1.5 rounded hover:bg-yellow-400 hover:text-black transition-colors block w-full"
          >
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
}

export default LoanAffordabilityCalculator;
