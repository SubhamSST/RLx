import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { useLocation, useNavigate } from "react-router-dom";

function Analytics() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [calcData, setCalcData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.calcData) {
      setCalcData(state.calcData);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [state]);

  const getKPICards = () => {
    if (!calcData) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {calcData.kpis.map((kpi, index) => (
          <div 
            key={index} 
            className="bg-[#1a1a1a] rounded-xl p-6 text-white shadow-lg transform transition-all duration-300 hover:scale-105"
          >
            <h2 className="text-lg text-gray-400 mb-2">{kpi.label}</h2>
            <p className="text-3xl font-bold text-yellow-400">{kpi.value}</p>
            {kpi.change && (
              <p className={`text-sm mt-2 ${kpi.change > 0 ? "text-green-400" : "text-red-400"}`}>
                {kpi.change > 0 ? "↑" : "↓"} {Math.abs(kpi.change)}%
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderNoData = () => (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-xl text-gray-400 mb-4">No calculation data available</h3>
        <p className="text-gray-500 mb-6">Please run a calculation first and then view analytics</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  const renderCharts = () => {
    if (!calcData) return null;

    return (
      <>
        {/* Main Chart */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">{calcData.mainChart.title}</h2>
          <Plot
            data={calcData.mainChart.data}
            layout={{
              ...calcData.mainChart.layout,
              paper_bgcolor: "rgba(0,0,0,0)",
              plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#fff", family: "Inter, Helvetica Neue, sans-serif" },
              margin: { l: 50, r: 30, t: 30, b: 50 },
              showlegend: true,
              legend: { x: 0, y: 1.1, orientation: "h" },
              autosize: true,
              height: 400,
            }}
            style={{ width: "100%" }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {calcData.secondaryCharts && calcData.secondaryCharts.map((chart, index) => (
            <div key={index} className="bg-[#1a1a1a] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">{chart.title}</h2>
              <Plot
                data={chart.data}
                layout={{
                  ...chart.layout,
                  paper_bgcolor: "rgba(0,0,0,0)",
                  plot_bgcolor: "rgba(0,0,0,0)",
                  font: { color: "#fff", family: "Inter, Helvetica Neue, sans-serif" },
                  margin: { l: 40, r: 20, t: 30, b: 40 },
                  showlegend: chart.showLegend || false,
                  autosize: true,
                  height: 300,
                }}
                style={{ width: "100%" }}
                config={{ responsive: true, displayModeBar: false }}
              />
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Financial Analytics</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
          >
            <span className="mr-2">←</span> Back to Dashboard
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        ) : (
          <>
            {calcData ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{calcData.title}</h2>
                  <p className="text-gray-400">{calcData.description}</p>
                </div>
                
                {getKPICards()}
                {renderCharts()}
              </>
            ) : (
              renderNoData()
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;
