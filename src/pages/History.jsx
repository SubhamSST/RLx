import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { getRecentCalculations, deleteCalculation } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

function History() {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchCalculations();
    }
  }, [user]);

  const fetchCalculations = async () => {
    try {
      setLoading(true);
      console.log("Fetching calculations for user:", user.id);
      const data = await getRecentCalculations(user.id);
      console.log("Calculations retrieved:", data);
      setCalculations(data);
      generateAnalytics(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching calculations:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = (data) => {
    // Simple analytics based on calculation types
    const typeCount = {};
    data.forEach(calc => {
      typeCount[calc.type] = (typeCount[calc.type] || 0) + 1;
    });
    
    setAnalyticsData(typeCount);
  };

  const handleDeleteCalculation = async (id) => {
    try {
      // Delete a specific calculation
      const success = await deleteCalculation(id, user.id);
      
      if (!success) throw new Error("Failed to delete calculation");
      
      // Update local state
      setCalculations(prev => {
        const updated = prev.filter(calc => calc.id !== id);
        generateAnalytics(updated);
        return updated;
      });
    } catch (err) {
      setError(err.message);
      console.error("Error deleting calculation:", err);
    }
  };

  return (
    <div className="history-page p-6 min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-2 text-yellow-400">Calculation History</h1>
      <p className="text-gray-400 mb-8">Your last 10 financial calculations</p>
      
      <Link 
        to="/dashboard" 
        className="inline-flex items-center px-4 py-2 mb-6 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Back to Dashboard
      </Link>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 bg-red-100 bg-opacity-10 rounded">
          Error: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Analytics Section */}
          <div className="md:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Analytics</h2>
            {analyticsData && Object.keys(analyticsData).length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Calculation Types</h3>
                <ul className="space-y-2">
                  {Object.entries(analyticsData).map(([type, count]) => (
                    <li key={type} className="flex justify-between items-center">
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <span className="bg-yellow-400 text-black px-2 py-1 rounded-full text-sm">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-400">No data available for analytics</p>
            )}
          </div>
          
          {/* Calculations List */}
          <div className="md:col-span-2">
            {calculations.length > 0 ? (
              <ul className="space-y-4">
                {calculations.map(calc => (
                  <li key={calc.id} className="p-4 bg-zinc-900 rounded-lg shadow-lg transition-all hover:shadow-yellow-400/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full capitalize">
                            {calc.type || calc.calculator_type || 'Unknown'}
                          </span>
                          <p className="text-gray-400 text-xs">{new Date(calc.created_at).toLocaleString()}</p>
                        </div>
                        <p className="text-lg font-medium">{calc.description || 'Calculation'}</p>
                        <div className="mt-2 bg-zinc-800 p-2 rounded text-sm">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(calc.calculation_data, null, 2)}</pre>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCalculation(calc.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 bg-zinc-900 rounded-lg">
                <p className="text-xl text-gray-400">No calculations found</p>
                <p className="text-gray-500 mt-2">Start using the calculators to see your history</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
