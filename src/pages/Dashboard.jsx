import React from "react";
import LoanPredictorCard from "../components/LoanPredictorCard";
import SipCalculatorCard from "../components/SipCalculatorCard";
import EmiCalculatorCard from "../components/EmiCalculatorCard";
import LumpsumCalculatorCard from "../components/LumpsumCalculatorCard";
import { useNavigate, Link } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import RetirementCorpusCalculator from "../components/RetirementCorpusCalculator";
import LoanAffordabilityCalculator from "../components/LoanAffordabilityCalculator";
import SWPCalculatorCard from "../components/SWPCalculatorCard";
import RentVsBuyCalculatorCard from "../components/RentVsBuyCalculatorCard";
import MonthlyExpensesCard from "../components/MonthlyExpensesCard";
import FuelCostCalculatorCard from "../components/FuelCostCalculatorCard";
import ElectricityBillCalculatorCard from "../components/ElectricityBillCalculatorCard";
import GeoPredictorCard from "../components/GeoPredictorCard";

function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut().then(() => {
      navigate("/");
    });
  };

  return (
    <div className="dashboard-container w-full min-h-screen bg-black text-white p-10">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-yellow-400">Dashboard</h1>
        <p className="text-gray-400 text-lg">Your finance tools in one place</p>
        <div className="mt-4">
          <Link 
            to="/history" 
            className="inline-flex items-center px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Calculation History
          </Link>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="absolute top-0.5 right-10 px-1 py-2 flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 hover:shadow-red-400 transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3h-10m10 0l-3-3m3 3l-3 3"
          />
        </svg>
        Logout
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
        <SipCalculatorCard />
        <EmiCalculatorCard />
        <LumpsumCalculatorCard />
        <RetirementCorpusCalculator />
        <LoanAffordabilityCalculator />
        <SWPCalculatorCard />
        <RentVsBuyCalculatorCard />
        <MonthlyExpensesCard />
        <FuelCostCalculatorCard />
        <ElectricityBillCalculatorCard />
        <GeoPredictorCard />
        <LoanPredictorCard />
      </div>
    </div>
  );
}

export default Dashboard;