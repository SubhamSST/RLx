import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function ElectricityBillCalculatorCard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [appliances, setAppliances] = useState([]);
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [wattage, setWattage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState("");
  const [result, setResult] = useState(null);

  const addAppliance = () => {
    if (!name || !hours || !wattage || !quantity) return;
    const newAppliance = {
      name,
      hours: parseFloat(hours),
      wattage: parseFloat(wattage),
      quantity: parseInt(quantity),
    };
    setAppliances([...appliances, newAppliance]);
    setName("");
    setHours("");
    setWattage("");
    setQuantity(1);
  };

  const removeLastAppliance = () => {
    const updated = [...appliances];
    updated.pop();
    setAppliances(updated);
  };

  const calculateBill = () => {
    const totalUnitsPerDay = appliances.reduce((sum, app) => {
      const dailyWattHr = app.hours * app.wattage * app.quantity;
      return sum + dailyWattHr / 1000;
    }, 0);
    const monthlyUnits = totalUnitsPerDay * 30;
    const total = monthlyUnits * parseFloat(unitCost);

    const applianceData = appliances.map(app => {
      const dailyConsumption = (app.hours * app.wattage * app.quantity) / 1000;
      const monthlyConsumption = dailyConsumption * 30;
      const monthlyCost = monthlyConsumption * parseFloat(unitCost);
      return {
        ...app,
        dailyConsumption,
        monthlyConsumption,
        monthlyCost,
        percentage: (monthlyConsumption / monthlyUnits) * 100
      };
    });

    setResult({
      total,
      monthlyUnits,
      applianceData
    });
    
    // Save calculation to history if user is logged in
    if (user) {
      const calculationData = {
        appliances: appliances.map(app => ({
          name: app.name,
          hours: app.hours,
          wattage: app.wattage,
          quantity: app.quantity
        })),
        unitCost: parseFloat(unitCost),
        totalUnitsPerDay,
        monthlyUnits,
        total,
        applianceBreakdown: applianceData.map(app => ({
          name: app.name,
          monthlyCost: app.monthlyCost,
          percentage: app.percentage
        })),
        result: total
      };
      
      const description = `Electricity Bill: ₹${total.toFixed(2)} for ${monthlyUnits.toFixed(2)} units`;
      
      saveToHistory('electricity_bill', description, calculationData);
    }
  };

  const viewAnalytics = () => {
    if (!result) return;

    const sortedAppliances = [...result.applianceData].sort((a, b) =>
      b.monthlyConsumption - a.monthlyConsumption
    );

    const applianceNames = sortedAppliances.map(app => app.name);
    const consumptionValues = sortedAppliances.map(app => app.monthlyConsumption);
    const costValues = sortedAppliances.map(app => app.monthlyCost);
    const hourlyDistribution = Array(24).fill(0);

    sortedAppliances.forEach(app => {
      const hoursPerDay = app.hours;
      const consumptionPerHour = app.dailyConsumption / hoursPerDay;

      if (app.name.toLowerCase().includes("light")) {
        for (let i = 0; i < hoursPerDay; i++) {
          const hour = (18 + i) % 24;
          hourlyDistribution[hour] += consumptionPerHour;
        }
      } else if (app.name.toLowerCase().includes("ac") || app.name.toLowerCase().includes("air conditioner")) {
        for (let i = 0; i < hoursPerDay; i++) {
          const hour = (i < hoursPerDay / 2) ? (13 + i) % 24 : (22 + i) % 24;
          hourlyDistribution[hour] += consumptionPerHour;
        }
      } else {
        for (let i = 0; i < hoursPerDay; i++) {
          const hour = (8 + i) % 24;
          hourlyDistribution[hour] += consumptionPerHour;
        }
      }
    });

    const analyticsData = {
      title: "Electricity Usage Analysis",
      description: "Detailed breakdown of your electricity consumption and costs",
      kpis: [
        {
          label: "Monthly Bill",
          value: `₹${result.total.toFixed(2)}`
        },
        {
          label: "Daily Average",
          value: `₹${(result.total / 30).toFixed(2)}`
        },
        {
          label: "Monthly Usage",
          value: `${result.monthlyUnits.toFixed(2)} kWh`
        }
      ],
      mainChart: {
        title: "Appliance Energy Consumption",
        data: [
          {
            type: "bar",
            x: applianceNames,
            y: consumptionValues,
            marker: { color: "#A855F7" },
            name: "kWh per Month"
          }
        ],
        layout: {
          xaxis: { title: "Appliance" },
          yaxis: { title: "Consumption (kWh)" }
        }
      },
      secondaryCharts: [
        {
          title: "Cost Distribution by Appliance",
          data: [
            {
              type: "pie",
              labels: applianceNames,
              values: costValues,
              textinfo: "percent+label",
              marker: {
                colors: ["#A855F7", "#C084FC", "#D8B4FE", "#E9D5FF", "#F3E8FF"]
              }
            }
          ],
          showLegend: false
        },
        {
          title: "Hourly Energy Usage Pattern",
          data: [
            {
              type: "scatter",
              mode: "lines+markers",
              x: Array.from({ length: 24 }, (_, i) => i),
              y: hourlyDistribution,
              line: { color: "#A855F7" },
              name: "kWh"
            }
          ],
          layout: {
            xaxis: { title: "Hour of Day", tickvals: Array.from({ length: 24 }, (_, i) => i) },
            yaxis: { title: "Consumption (kWh)" }
          }
        }
      ]
    };

    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div className="card bg-[#1a1a1a] p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:rotate-[-1deg]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-purple-300">Electricity Bill Estimator</h2>
        <div className="relative group">
          <span className="text-white text-lg cursor-pointer">ℹ️</span>
          <div className="absolute hidden group-hover:block bg-gray-800 text-white text-sm rounded-md px-3 py-2 z-10 top-6 right-0 w-64">
            Add each appliance, hours of use, power (wattage), and quantity. We'll estimate your monthly electricity bill based on that.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <input
          type="text"
          placeholder="Appliance Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <input
          type="number"
          placeholder="Hours Used Per Day"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <input
          type="number"
          placeholder="Wattage (W)"
          value={wattage}
          onChange={(e) => setWattage(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <button onClick={addAppliance} className="bg-purple-400 text-black px-4 py-2 rounded font-semibold">
          ➕ Add Appliance
        </button>
        <button onClick={removeLastAppliance} className="bg-red-500 text-white px-4 py-1 rounded text-sm">
          ⤿ Undo Last
        </button>
      </div>

      <div className="mb-4">
        <input
          type="number"
          placeholder="Per Unit Electricity Cost (₹)"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white w-full"
        />
      </div>

      <button
        onClick={calculateBill}
        className="bg-green-400 text-black px-6 py-2 rounded font-bold"
      >
        💡 Calculate Monthly Bill
      </button>

      {result && (
        <div className="mt-5 text-white">
          <p className="text-lg">Total Monthly Units: {result.monthlyUnits.toFixed(2)} kWh</p>
          <p className="text-xl font-semibold">Estimated Bill: ₹{result.total.toFixed(2)}</p>
          <button
            onClick={viewAnalytics}
            className="mt-3 bg-transparent border border-purple-400 text-purple-400 px-4 py-1.5 rounded hover:bg-purple-400 hover:text-black transition-colors w-full"
          >
            View Analytics
          </button>
        </div>
      )}

      {appliances.length > 0 && (
        <div className="mt-4 text-sm text-gray-300">
          <p className="font-semibold">Appliances Added:</p>
          <ul className="list-disc ml-5">
            {appliances.map((a, idx) => (
              <li key={idx}>
                {a.quantity} × {a.name} – {a.hours} hrs/day @ {a.wattage}W
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ElectricityBillCalculatorCard;
