import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSaveCalculation } from "../lib/useSaveCalculation";

function FuelCostCalculatorCard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const saveToHistory = useSaveCalculation();
  const [distance, setDistance] = useState("");
  const [efficiency, setEfficiency] = useState("");
  const [price, setPrice] = useState("");
  const [result, setResult] = useState(null);

  const calculateFuelCost = () => {
    if (distance && efficiency && price) {
      const fuelNeeded = distance / efficiency;
      const costPerTrip = fuelNeeded * price;
      setResult(costPerTrip);
      
      // Save calculation to history if user is logged in
      if (user) {
        const calculationData = {
          distance: parseFloat(distance),
          efficiency: parseFloat(efficiency),
          fuelPrice: parseFloat(price),
          fuelNeeded,
          costPerTrip,
          costPerKm: costPerTrip / parseFloat(distance),
          annualCost: costPerTrip * 104, // Assuming 2 trips per week
          carbonFootprint: fuelNeeded * 2.68, // kg CO2 per liter of petrol (approx)
          result: costPerTrip
        };
        
        const description = `Fuel Cost: ₹${costPerTrip.toFixed(2)} for ${distance}km trip`;
        
        saveToHistory('fuel_cost', description, calculationData);
      }
    }
  };
  
  const viewAnalytics = () => {
    if (result === null) return;
    
    const fuelNeeded = distance / efficiency;
    const costPerTrip = fuelNeeded * price;
    
    // Calculate additional data for analytics
    const costPerKm = costPerTrip / distance;
    const annualCost = costPerTrip * 104; // Assuming 2 trips per week
    const carbonFootprint = fuelNeeded * 2.68; // kg CO2 per liter of petrol (approx)
    
    // Create comparison data
    const efficiencyComparison = [5, 10, 15, 20, 25, 30];
    const costComparison = efficiencyComparison.map(eff => 
      (distance / eff) * price
    );
    
    // Calculate price trend (for hypothetical future price increases)
    const priceIncrements = [0, 5, 10, 15, 20, 25];
    const priceLabels = priceIncrements.map(inc => `₹${(price * (1 + inc/100)).toFixed(2)}`);
    const costTrend = priceIncrements.map(inc => 
      (distance / efficiency) * (price * (1 + inc/100))
    );
    
    // Monthly cost projection (30 days)
    const monthlyProjection = Array.from({length: 30}, (_, i) => {
      // Randomly vary daily distance between 80%-120% of input distance
      const dailyDistance = distance * (0.8 + Math.random() * 0.4);
      return {
        day: i + 1,
        cost: (dailyDistance / efficiency) * price,
        distance: dailyDistance
      };
    });
    
    const dailyCosts = monthlyProjection.map(d => d.cost);
    const dailyDistances = monthlyProjection.map(d => d.distance);
    const cumulativeCost = monthlyProjection.reduce((acc, d, i) => {
      acc.push((acc[i-1] || 0) + d.cost);
      return acc;
    }, []);
    
    // Prepare data for analytics page
    const analyticsData = {
      title: "Fuel Cost Analysis",
      description: `Analysis of fuel costs for a ${distance} km trip at ${efficiency} km/l and ₹${price}/l`,
      kpis: [
        { 
          label: "Cost per Trip", 
          value: `₹${result.toFixed(2)}`
        },
        { 
          label: "Cost per Km", 
          value: `₹${costPerKm.toFixed(2)}`
        },
        { 
          label: "Annual Cost", 
          value: `₹${annualCost.toFixed(2)}`
        }
      ],
      mainChart: {
        title: "Efficiency vs. Cost Comparison",
        data: [
          {
            type: "bar",
            x: efficiencyComparison.map(e => `${e} km/l`),
            y: costComparison,
            marker: { color: "#EAB308" },
            name: "Trip Cost"
          }
        ],
        layout: {
          xaxis: { title: "Fuel Efficiency" },
          yaxis: { title: "Trip Cost (₹)" }
        }
      },
      secondaryCharts: [
        {
          title: "Monthly Cost Projection",
          data: [
            {
              type: "scatter",
              mode: "lines",
              x: monthlyProjection.map(d => `Day ${d.day}`),
              y: cumulativeCost,
              line: { color: "#EAB308" },
              name: "Cumulative Cost"
            }
          ],
          layout: {
            xaxis: { title: "Day" },
            yaxis: { title: "Cumulative Cost (₹)" }
          }
        },
        {
          title: "Fuel Price Impact",
          data: [
            {
              type: "bar",
              x: priceLabels,
              y: costTrend,
              marker: { 
                color: costTrend.map((_, i) => 
                  `rgba(234, 179, 8, ${0.4 + (i * 0.1)})`
                )
              }
            }
          ],
          layout: {
            xaxis: { title: "Fuel Price" },
            yaxis: { title: "Trip Cost (₹)" }
          }
        }
      ]
    };
    
    // Navigate to analytics page with data
    navigate("/analytics", { state: { calcData: analyticsData } });
  };

  return (
    <div className="card bg-[#1a1a1a] p-8 rounded-2xl shadow-lg transition transform hover:scale-105 hover:-rotate-1">
      <h2 className="text-2xl font-bold mb-4 text-yellow-300 flex items-center">
        Fuel Cost Calculator
        <span className="relative group cursor-pointer ml-2">
          <span className="text-sm bg-gray-700 px-2 rounded-full">i</span>
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 bg-gray-800 text-white text-xs px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
            Calculates cost for a single trip based on distance, mileage, and fuel rate.
          </div>
        </span>
      </h2>

      <div className="flex flex-col gap-3 mb-4">
        <input
          type="number"
          placeholder="Distance (km)"
          value={distance}
          onChange={(e) => setDistance(+e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <input
          type="number"
          placeholder="Fuel Efficiency (km/l)"
          value={efficiency}
          onChange={(e) => setEfficiency(+e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />
        <input
          type="number"
          placeholder="Fuel Price (₹/l)"
          value={price}
          onChange={(e) => setPrice(+e.target.value)}
          className="p-2 rounded bg-black border border-gray-600 text-white"
        />

        <button
          onClick={calculateFuelCost}
          className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold"
        >
          Calculate
        </button>
      </div>

      {result !== null && (
        <div className="mt-4 text-white">
          <p className="text-lg">Cost per Trip: ₹{result.toFixed(2)}</p>
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

export default FuelCostCalculatorCard;
