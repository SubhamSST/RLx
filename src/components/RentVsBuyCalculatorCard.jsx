import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function RentVsBuyCalculatorCard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [rent, setRent] = useState("");
  const [price, setPrice] = useState("");
  const [interest, setInterest] = useState("");
  const [tenure, setTenure] = useState("");
  const [appreciation, setAppreciation] = useState("");
  const [result, setResult] = useState(null);

  const viewAnalytics = () => {
    if (!result) return;

    const loanAmt = parseFloat(price);
    const r = parseFloat(interest) / 12 / 100;
    const n = parseFloat(tenure) * 12;
    const yearlyAppreciation = parseFloat(appreciation) / 100;

    const years = [];
    const rentCumulative = [];
    const buyCumulative = [];
    const propertyValues = [];

    let totalRentPaid = 0;
    let totalEmiPaid = 0;

    const emi = parseFloat(result.emi);
    const monthlyRent = parseFloat(rent);

    for (let year = 1; year <= parseFloat(tenure); year++) {
      years.push(`Year ${year}`);
      totalRentPaid += monthlyRent * 12;
      rentCumulative.push(totalRentPaid);
      totalEmiPaid += emi * 12;
      buyCumulative.push(totalEmiPaid);
      const propertyValue = loanAmt * Math.pow(1 + yearlyAppreciation, year);
      propertyValues.push(propertyValue);
    }

    let breakEvenYear = "Never";
    for (let i = 0; i < rentCumulative.length; i++) {
      if (buyCumulative[i] - propertyValues[i] < rentCumulative[i]) {
        breakEvenYear = `Year ${i + 1}`;
        break;
      }
    }

    const netBuyCost = parseFloat(result.totalLoanOutgo) - parseFloat(result.appreciationValue);
    const netRentCost = parseFloat(result.totalRent);
    const savings = Math.abs(netBuyCost - netRentCost);

    const analyticsData = {
      title: "Rent vs. Buy Analysis",
      description: `Analysis of renting vs. buying a property worth ₹${parseInt(price).toLocaleString()} over ${tenure} years`,
      kpis: [
        { label: "Monthly EMI", value: `₹${result.emi}` },
        { label: "Break-even", value: breakEvenYear },
        {
          label: "Better Option Savings",
          value: `₹${savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        }
      ],
      mainChart: {
        title: "Rent vs. Buy Cost Over Time",
        data: [
          {
            x: years,
            y: rentCumulative,
            type: "scatter",
            mode: "lines",
            name: "Cumulative Rent",
            line: { color: "#3B82F6", width: 3 }
          },
          {
            x: years,
            y: buyCumulative.map((val, i) => val - propertyValues[i]),
            type: "scatter",
            mode: "lines",
            name: "Net Buy Cost (EMI - Property Value)",
            line: { color: "#93C5FD", width: 3 }
          }
        ],
        layout: {
          xaxis: { title: "Year" },
          yaxis: { title: "Cost (₹)" }
        }
      },
      secondaryCharts: [
        {
          title: "Property Value Appreciation",
          data: [
            {
              x: years,
              y: propertyValues,
              type: "scatter",
              mode: "lines+markers",
              line: { color: "#10B981" },
              name: "Property Value"
            }
          ],
          layout: {
            xaxis: { title: "Year" },
            yaxis: { title: "Value (₹)" }
          }
        },
        {
          title: "Final Cost Comparison",
          data: [
            {
              type: "bar",
              x: ["Total Rent", "Total EMI", "Property Value", "Net Buy Cost"],
              y: [
                parseFloat(result.totalRent),
                parseFloat(result.totalLoanOutgo),
                parseFloat(result.appreciationValue),
                netBuyCost
              ],
              marker: {
                color: ["#3B82F6", "#93C5FD", "#10B981", "#6EE7B7"]
              }
            }
          ],
          layout: {
            yaxis: { title: "Amount (₹)" }
          }
        }
      ]
    };

    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  const calculate = () => {
    const loanAmt = parseFloat(price);
    const r = parseFloat(interest) / 12 / 100;
    const n = parseFloat(tenure) * 12;
    const appRate = parseFloat(appreciation) / 100;
    const rentAmt = parseFloat(rent);

    if (isNaN(loanAmt) || isNaN(r) || isNaN(n) || isNaN(appRate) || isNaN(rentAmt)) {
      alert("Please enter all valid numbers.");
      return;
    }

    const emi = (loanAmt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalLoanOutgo = emi * n;
    const appreciationValue = loanAmt * Math.pow(1 + appRate, tenure);
    const totalRent = rentAmt * 12 * tenure;

    const decision =
      totalLoanOutgo - appreciationValue < totalRent
        ? "Buying is better"
        : "Renting is better";

    const resultData = {
      emi: emi.toFixed(0),
      totalRent: totalRent.toFixed(0),
      appreciationValue: appreciationValue.toFixed(0),
      totalLoanOutgo: totalLoanOutgo.toFixed(0),
      decision
    };
    
    setResult(resultData);
    
    // Save calculation to history if user is logged in
    if (user) {
      const calculationData = {
        monthlyRent: parseFloat(rent),
        propertyPrice: parseFloat(price),
        interestRate: parseFloat(interest),
        tenureYears: parseFloat(tenure),
        appreciationRate: parseFloat(appreciation),
        emi: parseFloat(emi.toFixed(0)),
        totalRent: parseFloat(totalRent.toFixed(0)),
        appreciationValue: parseFloat(appreciationValue.toFixed(0)),
        totalLoanOutgo: parseFloat(totalLoanOutgo.toFixed(0)),
        decision,
        result: decision
      };
      
      const description = `Rent vs Buy: ${decision} for ₹${parseFloat(price).toLocaleString()} property`;
      
      saveToHistory('rent_vs_buy', description, calculationData);
    }
  };

  return (
    <div className="card bg-[#1a1a1a] p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:-rotate-1 relative">
      <h2 className="text-2xl font-bold mb-4 text-green-300 flex items-center">
        Rent vs Buy Calculator
        <span className="relative group cursor-pointer ml-2">
          <span className="text-sm bg-gray-700 px-2 rounded-full">i</span>
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-64 bg-gray-800 text-white text-xs px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
            Compares the cost of renting vs buying a property based on EMI, appreciation, and rent.
          </div>
        </span>
      </h2>

      <div className="flex flex-col gap-3 mb-4">
        <input type="number" placeholder="Monthly Rent" value={rent} onChange={(e) => setRent(e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input type="number" placeholder="Property Price" value={price} onChange={(e) => setPrice(e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input type="number" placeholder="Loan Interest Rate (%)" value={interest} onChange={(e) => setInterest(e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input type="number" placeholder="Tenure (years)" value={tenure} onChange={(e) => setTenure(e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input type="number" placeholder="Property Appreciation (%)" value={appreciation} onChange={(e) => setAppreciation(e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <button onClick={calculate} className="bg-blue-400 text-black px-5 py-2 rounded-lg font-semibold">
          Calculate
        </button>
      </div>

      {result && (
        <div className="mt-4 text-white text-sm">
          <p>Monthly EMI: ₹{result.emi}</p>
          <p>Total Rent Paid: ₹{result.totalRent}</p>
          <p>Estimated Property Value: ₹{result.appreciationValue}</p>
          <p>Total EMI Outgo: ₹{result.totalLoanOutgo}</p>
          <p className="mt-2 font-bold text-lg text-yellow-400">{result.decision}</p>
          <button
            onClick={viewAnalytics}
            className="mt-3 bg-transparent border border-blue-400 text-blue-400 px-4 py-1.5 rounded hover:bg-blue-400 hover:text-black transition-colors w-full"
          >
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
}

export default RentVsBuyCalculatorCard;
