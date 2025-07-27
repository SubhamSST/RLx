// src/components/RetirementCorpusCalculator.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function RetirementCorpusCalculator() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [inputs, setInputs] = useState({
    currentAge: "",
    retirementAge: "",
    monthlyExpenses: "",
    inflationRate: "",
    postRetirementReturn: "",
  });

  const [corpus, setCorpus] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const calculateCorpus = () => {
    const {
      currentAge,
      retirementAge,
      monthlyExpenses,
      inflationRate,
      postRetirementReturn,
    } = inputs;

    const yearsToRetirement = retirementAge - currentAge;
    const annualExpensesToday = parseFloat(monthlyExpenses) * 12;
    const inflationAdjustedExpense = annualExpensesToday * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const realReturn = (postRetirementReturn - inflationRate) / 100;

    // Perpetual corpus formula
    const retirementCorpus = inflationAdjustedExpense / realReturn;
    setCorpus(retirementCorpus.toFixed(2));
    
    // Save calculation to history if user is logged in
    if (user) {
      const calculationData = {
        currentAge: parseFloat(currentAge),
        retirementAge: parseFloat(retirementAge),
        monthlyExpenses: parseFloat(monthlyExpenses),
        inflationRate: parseFloat(inflationRate),
        postRetirementReturn: parseFloat(postRetirementReturn),
        yearsToRetirement,
        annualExpensesToday,
        inflationAdjustedExpense,
        retirementCorpus: parseFloat(retirementCorpus.toFixed(2)),
        result: parseFloat(retirementCorpus.toFixed(2))
      };
      
      const description = `Retirement: ₹${parseFloat(retirementCorpus).toLocaleString()} corpus needed at age ${retirementAge}`;
      
      saveToHistory('retirement', description, calculationData);
    }
  };

  return (
    <div className="card bg-[#1a1a1a] p-8 rounded-2xl shadow-lg transition hover:scale-105 hover:rotate-1">
      <h2 className="text-2xl font-bold mb-4 text-yellow-300 flex items-center gap-2">
        Retirement Corpus Calculator
        <button onClick={() => setShowInfo(!showInfo)} className="text-white hover:text-yellow-300 transition">
          <Info size={20} />
        </button>
      </h2>

      {showInfo && (
        <div className="text-sm text-gray-300 mb-4 bg-black border border-gray-600 p-3 rounded-lg">
          <p>
            💡 <strong>Example:</strong> If you're 24 now and want to retire at 45, with today's monthly expenses of ₹1,00,000, and expect 6% inflation and 16% post-retirement return:
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>Expenses at age 45 ≈ ₹3.39L/month = ₹40.7L/year</li>
            <li>Required corpus = ₹40.7L / (16% - 6%) = ₹4.07Cr</li>
            <li>This corpus will generate ₹40.7L/year forever.</li>
          </ul>
          <p className="mt-2 text-green-400">This ensures your corpus never runs out and keeps up with inflation.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-4">
        <input type="number" name="currentAge" placeholder="Current Age" onChange={handleChange} className="p-2 bg-black border border-gray-600 rounded text-white" />
        <input type="number" name="retirementAge" placeholder="Retirement Age" onChange={handleChange} className="p-2 bg-black border border-gray-600 rounded text-white" />
        <input type="number" name="monthlyExpenses" placeholder="Current Monthly Expenses (₹)" onChange={handleChange} className="p-2 bg-black border border-gray-600 rounded text-white" />
        <input type="number" name="inflationRate" placeholder="Inflation Rate (%)" onChange={handleChange} className="p-2 bg-black border border-gray-600 rounded text-white" />
        <input type="number" name="postRetirementReturn" placeholder="Expected Return After Retirement (%)" onChange={handleChange} className="p-2 bg-black border border-gray-600 rounded text-white" />
        <button onClick={calculateCorpus} className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold">
          Calculate
        </button>
      </div>

      {corpus && (
        <div className="text-white mt-3">
          <p className="text-lg">💼 Required Retirement Corpus:</p>
          <p className="text-2xl font-bold text-green-400">₹{Number(corpus).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default RetirementCorpusCalculator;
