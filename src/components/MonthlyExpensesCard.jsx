import { useState } from "react";
import { useNavigate } from "react-router-dom";

function MonthlyExpensesCard() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(null);

  const addExpense = () => {
    if (!name || !amount || +amount <= 0) return;
    setExpenses([...expenses, { name, amount: +amount }]);
    setName("");
    setAmount("");
    setTotal(null); // reset on new add
  };

  const undoLast = () => {
    if (expenses.length === 0) return;
    setExpenses(expenses.slice(0, -1));
    setTotal(null); // reset on undo
  };

  const calculateTotal = () => {
    const sum = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    setTotal(sum);
  };
  
  const viewAnalytics = () => {
    if (!total || expenses.length === 0) return;
    
    // Sort expenses by amount (descending)
    const sortedExpenses = [...expenses].sort((a, b) => b.amount - a.amount);
    
    // Calculate percentages
    const expenseNames = sortedExpenses.map(e => e.name);
    const expenseAmounts = sortedExpenses.map(e => e.amount);
    const expensePercentages = expenseAmounts.map(amount => ((amount / total) * 100).toFixed(1));
    
    // Group smaller expenses if there are many
    const MAX_DISPLAYED = 5;
    if (expenses.length > MAX_DISPLAYED) {
      const topExpenses = sortedExpenses.slice(0, MAX_DISPLAYED - 1);
      const otherExpenses = sortedExpenses.slice(MAX_DISPLAYED - 1);
      
      const otherSum = otherExpenses.reduce((sum, e) => sum + e.amount, 0);
      const topNames = topExpenses.map(e => e.name);
      const topAmounts = topExpenses.map(e => e.amount);
      
      expenseNames.splice(MAX_DISPLAYED - 1);
      expenseAmounts.splice(MAX_DISPLAYED - 1);
      expensePercentages.splice(MAX_DISPLAYED - 1);
      
      expenseNames.push("Others");
      expenseAmounts.push(otherSum);
      expensePercentages.push(((otherSum / total) * 100).toFixed(1));
    }
    
    // Calculate budget allocation for typical expenses
    const essentials = 0.5 * total; // 50% for essentials
    const savings = 0.3 * total; // 30% for savings
    const discretionary = 0.2 * total; // 20% for discretionary
    
    // Prepare data for analytics page
    const analyticsData = {
      title: "Monthly Expenses Analysis",
      description: `Breakdown and analysis of ${expenses.length} monthly expenses totaling ₹${total.toLocaleString()}`,
      kpis: [
        { 
          label: "Total Expenses", 
          value: `₹${total.toLocaleString()}`
        },
        { 
          label: "Top Expense", 
          value: `${sortedExpenses[0].name}`
        },
        { 
          label: "Top Expense %", 
          value: `${((sortedExpenses[0].amount / total) * 100).toFixed(1)}%`
        }
      ],
      mainChart: {
        title: "Expense Breakdown",
        data: [
          {
            type: "pie",
            labels: expenseNames,
            values: expenseAmounts,
            text: expensePercentages.map(p => `${p}%`),
            textinfo: "label+percent",
            hoverinfo: "label+value+percent",
            marker: {
              colors: [
                "#F56565", "#ED8936", "#ECC94B", "#48BB78", "#38B2AC", 
                "#4299E1", "#667EEA", "#9F7AEA", "#D53F8C"
              ]
            }
          }
        ],
        layout: {
          showlegend: false
        }
      },
      secondaryCharts: [
        {
          title: "50/30/20 Budget Rule Comparison",
          data: [
            {
              type: "bar",
              x: ["Essentials (50%)", "Savings (30%)", "Discretionary (20%)"],
              y: [essentials, savings, discretionary],
              marker: {
                color: ["#48BB78", "#4299E1", "#F56565"]
              }
            }
          ],
          layout: {
            yaxis: { title: "Amount (₹)" }
          }
        },
        {
          title: "Top Expenses Breakdown",
          data: [
            {
              type: "bar",
              x: expenseNames,
              y: expenseAmounts,
              marker: { color: "#9F7AEA" }
            }
          ],
          layout: {
            xaxis: { title: "Expense Category" },
            yaxis: { title: "Amount (₹)" }
          }
        }
      ]
    };
    
    // Navigate to analytics page with data
    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div className="card bg-[#1a1a1a] text-white p-8 rounded-2xl shadow-lg transition hover:scale-105 hover:-rotate-1 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-yellow-300">Monthly Expenses</h2>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Expense Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600"
        />
        <input
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600"
        />

        <div className="flex gap-2">
          <button
            onClick={addExpense}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold">
            Add
          </button>
          <button
            onClick={undoLast}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg">
            Undo Last
          </button>
          <button
            onClick={calculateTotal}
            className="bg-green-500 text-black px-4 py-2 rounded-lg font-semibold">
            Calculate
          </button>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Your Expenses:</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            {expenses.map((e, i) => (
              <li key={i}>• {e.name}: ₹{e.amount.toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}

      {total !== null && (
        <div className="mt-6">
          <p className="text-lg text-green-300 font-bold">
            Total Monthly Expense: ₹{total.toLocaleString()}
          </p>
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

export default MonthlyExpensesCard;
