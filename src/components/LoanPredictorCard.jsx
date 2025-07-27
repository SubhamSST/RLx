import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '@clerk/clerk-react';
import useSaveCalculation from '../lib/useSaveCalculation';

function LoanPredictorCard() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    loan_amnt: "",
    int_rate: "",
    annual_inc: "",
    dti: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();

  // Add entrance animation effect
  useEffect(() => {
    const timeout = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/predict", {
        loan_amnt: parseFloat(formData.loan_amnt),
        int_rate: parseFloat(formData.int_rate),
        annual_inc: parseFloat(formData.annual_inc),
        dti: parseFloat(formData.dti),
      });
      setResult(res.data);
      
      // Save to history
      if (user) {
        const approved = res.data.message.includes("Approved");
        const calculationData = {
          inputs: {
            loan_amount: parseFloat(formData.loan_amnt),
            interest_rate: parseFloat(formData.int_rate),
            annual_income: parseFloat(formData.annual_inc),
            dti: parseFloat(formData.dti)
          },
          result: {
            status: approved ? "Approved" : "Not Approved",
            probability: parseFloat(res.data.probability),
            message: res.data.message
          }
        };
        
        const description = `Loan prediction for ₹${parseFloat(formData.loan_amnt).toLocaleString()} amount`;
        saveToHistory('loanPrediction', description, calculationData);
      }
    } catch (err) {
      setResult({
        message: "❌ Error: " + (err.response?.data?.detail || err.message),
      });
    }
    setLoading(false);
  };

  const viewAnalytics = () => {
    if (!result) return;
    
    const approved = result.message.includes("Approved");
    
    // Prepare data for analytics page
    const analyticsData = {
      title: "Loan Prediction Analysis",
      description: "Detailed analysis of your loan application prediction",
      kpis: [
        { 
          label: "Loan Amount", 
          value: `₹${parseFloat(formData.loan_amnt).toLocaleString()}`
        },
        { 
          label: "Approval Status", 
          value: approved ? "Approved" : "Not Approved" 
        },
        { 
          label: "Approval Probability", 
          value: `${(parseFloat(result.probability) * 100).toFixed(1)}%`,
          change: approved ? 5 : -3
        }
      ],
      mainChart: {
        title: "Loan Approval Factors",
        data: [
          {
            type: "bar",
            x: ["Loan Amount", "Interest Rate", "Annual Income", "DTI Ratio"],
            y: [
              parseFloat(formData.loan_amnt) / 10000,
              parseFloat(formData.int_rate) * 3,
              parseFloat(formData.annual_inc) / 10000,
              parseFloat(formData.dti) * 2
            ],
            marker: {
              color: ["#FFD700", "#FF6B6B", "#4CAF50", "#9370DB"]
            }
          }
        ],
        layout: {
          yaxis: { title: "Impact Score" }
        }
      },
      secondaryCharts: [
        {
          title: "Probability Breakdown",
          data: [
            {
              type: "pie",
              labels: ["Approval Chance", "Rejection Chance"],
              values: [
                parseFloat(result.probability) * 100,
                (1 - parseFloat(result.probability)) * 100
              ],
              marker: {
                colors: ["#4CAF50", "#FF6B6B"]
              }
            }
          ],
          showLegend: true
        },
        {
          title: "Income to Loan Ratio",
          data: [
            {
              type: "scatter",
              mode: "lines+markers",
              x: [0, 25, 50, 75, 100],
              y: [0, 25, 50, 75, 100],
              line: { color: "#FFD700" },
              name: "Ideal Ratio"
            },
            {
              type: "scatter",
              mode: "markers",
              x: [parseFloat(formData.loan_amnt) / parseFloat(formData.annual_inc) * 100],
              y: [parseFloat(formData.dti)],
              marker: { color: "#FF6B6B", size: 12 },
              name: "Your Position"
            }
          ],
          layout: {
            xaxis: { title: "Loan to Income Ratio (%)" },
            yaxis: { title: "DTI Ratio" }
          }
        }
      ]
    };
    
    // Navigate to analytics page with data
    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div className={`card bg-[#1a1a1a] p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:rotate-1 relative duration-700 ${
      animate ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-yellow-300">Loan Prediction</h2>

        {/* Info Icon */}
        <div className="group relative cursor-pointer">
          <div className="text-yellow-300 text-xl font-bold">ℹ️</div>
          <div className="absolute top-8 right-0 w-64 p-2 text-sm text-white bg-gray-800 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            This prediction is powered by a trained <strong>Random Forest</strong> model based on historical loan data.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <input name="loan_amnt" type="number" placeholder="Loan Amount" onChange={handleChange} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input name="int_rate" type="number" placeholder="Interest Rate (%)" onChange={handleChange} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input name="annual_inc" type="number" placeholder="Annual Income" onChange={handleChange} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <input name="dti" type="number" placeholder="DTI Ratio" onChange={handleChange} className="p-2 rounded bg-black border border-gray-600 text-white" />
        <button onClick={handleSubmit} className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold">
          {loading ? "Predicting..." : "Predict"}
        </button>
      </div>

      {result && (
        <div className="mt-4 text-white">
          <p className="text-lg">{result.message}</p>
          <p className="text-sm text-gray-400">Probability: {result.probability}</p>
          <button 
            onClick={viewAnalytics}
            className="mt-3 bg-transparent border border-yellow-400 text-yellow-400 px-4 py-1.5 rounded hover:bg-yellow-400 hover:text-black transition-colors"
          >
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
}

export default LoanPredictorCard;
