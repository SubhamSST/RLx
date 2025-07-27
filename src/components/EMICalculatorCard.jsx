import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function EMICalculatorCard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");
  const [emi, setEmi] = useState(null);

  const calculateEMI = () => {
    const p = +principal;
    const r = +rate / 12 / 100;
    const n = +tenure * 12;

    const emiValue = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    setEmi(emiValue);
    
    // Save calculation to history if user is logged in
    if (user) {
      const calculationData = {
        principal: p,
        interestRate: +rate,
        tenureYears: +tenure,
        emi: emiValue,
        totalPayment: emiValue * n,
        totalInterest: (emiValue * n) - p
      };
      
      const description = `EMI: ₹${p.toLocaleString()} loan at ${rate}% for ${tenure} years`;
      
      saveToHistory('emi', description, calculationData);
    }
  };

  const viewAnalytics = () => {
    if (!emi) return;

    // Calculate loan details
    const p = +principal;
    const r = +rate / 12 / 100;
    const n = +tenure * 12;
    const totalAmount = emi * n;
    const totalInterest = totalAmount - p;
    
    // Create months array for payment timeline
    const months = [];
    const principalPayments = [];
    const interestPayments = [];
    const balanceRemaining = [];
    
    let balance = p;
    
    for (let i = 1; i <= n; i++) {
      const interestPayment = balance * r;
      const principalPayment = emi - interestPayment;
      
      balance -= principalPayment;
      
      if (i % 6 === 0 || i === 1 || i === n) {
        months.push(`Month ${i}`);
        principalPayments.push(principalPayment);
        interestPayments.push(interestPayment);
        balanceRemaining.push(balance > 0 ? balance : 0);
      }
    }
    
    // Prepare data for analytics page
    const analyticsData = {
      title: "EMI Calculation Analysis",
      description: "Detailed breakdown of your loan EMI and payment schedule",
      kpis: [
        { 
          label: "Monthly EMI", 
          value: `₹${emi.toFixed(2)}`
        },
        { 
          label: "Total Interest", 
          value: `₹${totalInterest.toFixed(2)}`,
          change: 3
        },
        { 
          label: "Total Payment", 
          value: `₹${totalAmount.toFixed(2)}`
        }
      ],
      mainChart: {
        title: "Loan Payment Breakdown",
        data: [
          {
            type: "pie",
            labels: ["Principal", "Interest"],
            values: [p, totalInterest],
            marker: {
              colors: ["#ff9ff3", "#f368e0"]
            },
            textinfo: "label+percent"
          }
        ]
      },
      secondaryCharts: [
        {
          title: "Payment Timeline",
          data: [
            {
              type: "scatter",
              mode: "lines+markers",
              x: months,
              y: balanceRemaining,
              name: "Balance",
              line: { color: "#ff9ff3" }
            }
          ],
          layout: {
            xaxis: { title: "Period" },
            yaxis: { title: "Amount (₹)" }
          },
          showLegend: true
        },
        {
          title: "Principal vs Interest",
          data: [
            {
              type: "bar",
              x: months,
              y: principalPayments,
              name: "Principal",
              marker: { color: "#ff9ff3" }
            },
            {
              type: "bar",
              x: months,
              y: interestPayments,
              name: "Interest",
              marker: { color: "#f368e0" }
            }
          ],
          layout: {
            barmode: "stack",
            xaxis: { title: "Period" },
            yaxis: { title: "Amount (₹)" }
          },
          showLegend: true
        }
      ]
    };
    
    // Navigate to analytics page with data
    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div className="card bg-[#1a1a1a] p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:rotate-2">
      <h2 className="text-2xl font-bold mb-4 text-pink-300">EMI Calculator</h2>
      <div className="flex flex-col gap-3 mb-4">
        <input type="number" placeholder="Loan Amount" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input type="number" placeholder="Annual Interest Rate (%)" value={rate} onChange={(e) => setRate(e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input type="number" placeholder="Tenure (Years)" value={tenure} onChange={(e) => setTenure(e.target.value)} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <button onClick={calculateEMI} className="bg-pink-400 text-black px-5 py-2 rounded-lg font-semibold">
          Calculate EMI
        </button>
      </div>
      {emi && (
        <div className="mt-4 text-white">
          <p className="text-lg">Monthly EMI: ₹{emi.toFixed(2)}</p>
          <button 
            onClick={viewAnalytics}
            className="mt-3 bg-transparent border border-pink-400 text-pink-400 px-4 py-1.5 rounded hover:bg-pink-400 hover:text-black transition-colors"
          >
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
}

export default EMICalculatorCard;
