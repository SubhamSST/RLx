import { useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { saveCalculation } from './supabaseClient';

/**
 * Custom hook to save calculator data to history
 * 
 * @returns {Function} saveToHistory - Function to save calculation data
 */
export const useSaveCalculation = () => {
  const { user } = useUser();

  /**
   * Save a calculation to history
   * 
   * @param {string} type - Calculator type (e.g. 'sip', 'emi', 'loan')
   * @param {string} description - Brief description of the calculation
   * @param {object} data - Calculation data including inputs and result
   * @returns {Promise} - Promise that resolves with the saved calculation
   */
  const saveToHistory = useCallback(async (type, description, data) => {
    if (!user) {
      console.log('User not logged in, skipping history save');
      return null;
    }

    try {
      const savedCalculation = await saveCalculation(
        user.id,
        type,
        description,
        data
      );
      
      console.log(`${type} calculation saved to history:`, savedCalculation);
      return savedCalculation;
    } catch (error) {
      console.error(`Error saving ${type} calculation to history:`, error);
      return null;
    }
  }, [user]);

  return saveToHistory;
};

export default useSaveCalculation;