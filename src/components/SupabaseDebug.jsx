import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/clerk-react';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function SupabaseDebug() {
  const { user } = useUser();
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [calculationsData, setCalculationsData] = useState([]);

  const testConnection = async () => {
    setLoadingTest(true);
    setError(null);
    
    try {
      // Test the connection by checking if we can connect to Supabase
      const { data, error } = await supabase.from('calculations').select('count(*)', { count: 'exact' });
      
      if (error) throw error;
      
      setTestResult({
        connected: true,
        message: 'Successfully connected to Supabase',
        data
      });
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      setError(err.message);
    } finally {
      setLoadingTest(false);
    }
  };

  const fetchCalculations = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }
    
    setLoadingData(true);
    setError(null);
    
    try {
      // Try to fetch calculations directly
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCalculationsData(data);
    } catch (err) {
      console.error('Error fetching calculations:', err);
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const insertTestCalculation = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }
    
    setLoadingData(true);
    setError(null);
    
    try {
      // Insert a test calculation
      const testCalculation = {
        user_id: user.id,
        calculator_type: 'test_calculator',
        description: 'Test Calculation',
        calculation_data: { test: true, value: 1000 },
        result: { value: 1000 },
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('calculations')
        .insert([testCalculation])
        .select();
      
      if (error) throw error;
      
      setTestResult({
        inserted: true,
        message: 'Successfully inserted test calculation',
        data
      });
      
      // Refresh the calculations list
      fetchCalculations();
    } catch (err) {
      console.error('Error inserting test calculation:', err);
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-lg my-6">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Supabase Debug</h2>
      
      <div className="space-y-6">
        {/* Connection Test Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Connection Test</h3>
          <button
            onClick={testConnection}
            disabled={loadingTest}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loadingTest ? 'Testing...' : 'Test Supabase Connection'}
          </button>
          
          {testResult && (
            <div className="mt-2 p-3 bg-green-900 bg-opacity-20 rounded border border-green-500">
              <p className="text-green-400">{testResult.message}</p>
              <pre className="text-xs mt-1 text-gray-300">{JSON.stringify(testResult.data, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* Data Operations Section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Data Operations</h3>
          <div className="flex space-x-4">
            <button
              onClick={fetchCalculations}
              disabled={loadingData}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              {loadingData ? 'Loading...' : 'Fetch Calculations'}
            </button>
            
            <button
              onClick={insertTestCalculation}
              disabled={loadingData}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              {loadingData ? 'Inserting...' : 'Insert Test Calculation'}
            </button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900 bg-opacity-20 rounded border border-red-500">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}
        
        {/* Calculations Data Display */}
        {calculationsData.length > 0 ? (
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Fetched Calculations ({calculationsData.length})</h3>
            <div className="bg-zinc-800 p-4 rounded max-h-60 overflow-auto">
              <pre className="text-xs text-gray-300">{JSON.stringify(calculationsData, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No calculations data fetched yet</p>
        )}
        
        {/* Environment Variables */}
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Environment Variables</h3>
          <div className="bg-zinc-800 p-4 rounded">
            <p className="text-xs text-gray-300">SUPABASE_URL: {supabaseUrl ? '✅ Set' : '❌ Not set'}</p>
            <p className="text-xs text-gray-300">SUPABASE_ANON_KEY: {supabaseKey ? '✅ Set' : '❌ Not set'}</p>
            <p className="text-xs text-gray-300">User ID: {user?.id || 'Not logged in'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupabaseDebug;
