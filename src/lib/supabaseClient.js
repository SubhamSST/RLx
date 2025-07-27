import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Save a calculation to the user's history
 * @param {string} userId - The user's Clerk ID
 * @param {string} type - The type of calculation (e.g., 'loan', 'emi', 'sip')
 * @param {string} description - A brief description of the calculation
 * @param {object} data - The calculation data/results
 * @returns {Promise} - The Supabase insert operation promise
 */
export const saveCalculation = async (userId, type, description, data) => {
  if (!userId) {
    console.error("User ID is required to save calculation");
    return null;
  }
  
  try {
    const calculation = {
      user_id: userId,
      calculator_type: type, // Match Supabase field
      description: description,
      calculation_data: data, // Match Supabase field
      result: { value: data.result || 0 }, // Match Supabase field
      created_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase
      .from('calculations')
      .insert([calculation])
      .select();

    if (error) {
      console.error("Error saving calculation:", error);
      return null;
    }

    console.log("Calculation saved successfully:", result);
    return result[0];
  } catch (err) {
    console.error("Exception when saving calculation:", err);
    return null;
  }
};

/**
 * Get the last 10 calculations for a user
 * @param {string} userId - The user's Clerk ID
 * @returns {Promise} - The Supabase select operation promise
 */
export const getRecentCalculations = async (userId) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('calculations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching calculations:", error);
    return [];
  }

  // Transform the data to match what the History component expects
  return data.map(item => ({
    id: item.id,
    user_id: item.user_id,
    type: item.calculator_type,
    description: item.description,
    data: item.calculation_data,
    created_at: item.created_at
  }));
};

/**
 * Delete a calculation
 * @param {string} calculationId - The ID of the calculation to delete
 * @param {string} userId - The user's Clerk ID for verification
 * @returns {Promise} - The Supabase delete operation promise
 */
export const deleteCalculation = async (calculationId, userId) => {
  if (!userId || !calculationId) return false;

  const { error } = await supabase
    .from('calculations')
    .delete()
    .eq('id', calculationId)
    .eq('user_id', userId);

  if (error) {
    console.error("Error deleting calculation:", error);
    return false;
  }

  return true;
};

export default {
  saveCalculation,
  getRecentCalculations,
  deleteCalculation
};
