import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useUser } from '@clerk/clerk-react';
import useSaveCalculation from '../lib/useSaveCalculation';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue when using bundlers like Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Helper component to handle all map state synchronization and events
function MapUpdater({ coords, setSelectedCoords, setInstructionText }) {
    const map = useMap();

    // This effect updates the map's view whenever the 'coords' prop changes
    useEffect(() => {
        if (coords) {
            map.setView([coords.lat, coords.lng], 15); // Set view with a fixed zoom level
        }
    }, [coords, map]);

    // This hook handles map click events to update the marker position
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setSelectedCoords({ lat, lng });
            setInstructionText(`Pin set at: Lat ${lat.toFixed(4)}, Lon ${lng.toFixed(4)}`);
        },
    });

    return null; // This component does not render anything itself
}

function GeoPredictorCard() {
    const [dismil, setDismil] = useState('');
    const [price, setPrice] = useState('');
    const [years, setYears] = useState('');
    // Default to Sambalpur, India. It will be updated by geolocation.
    const [selectedCoords, setSelectedCoords] = useState({ lat: 21.4705, lng: 83.9833 });
    const [prediction, setPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const [currentValue, setCurrentValue] = useState(0);
    const [instructionText, setInstructionText] = useState('Click the button or a location on the map.');
    const [error, setError] = useState('');
    
    const { user } = useUser();
    const saveToHistory = useSaveCalculation();

    // Attempt to get user's location on initial load
    useEffect(() => {
        centerOnUserLocation();
    }, []);

    // Effect to calculate current value and enable/disable the prediction button
    useEffect(() => {
        const dismilValue = parseFloat(dismil);
        const priceValue = parseFloat(price);
        const yearsValue = parseInt(years);

        if (selectedCoords && dismilValue > 0 && priceValue > 0 && yearsValue > 0) {
            setIsButtonEnabled(true);
            setCurrentValue(dismilValue * priceValue);
        } else {
            setIsButtonEnabled(false);
            setCurrentValue(0);
        }
    }, [dismil, price, years, selectedCoords]);

    const centerOnUserLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by this browser.");
            return;
        }
        setInstructionText("Requesting your location...");
        setError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const userCoords = { lat: latitude, lng: longitude };
                setSelectedCoords(userCoords); // Just update the state, MapUpdater will handle the rest
                setInstructionText(`Location found! Pin set at: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`);
            },
            () => {
                const failMessage = "Could not get location. Using default. Please click on the map to set location.";
                setError(failMessage);
                setInstructionText(failMessage);
            }
        );
    };

    const getPrediction = async () => {
        if (!isButtonEnabled) return;

        setIsLoading(true);
        setPrediction(null);
        setError('');

        const currentValue = parseFloat(dismil) * parseFloat(price);

        const prompt = `
            Analyze the following real estate data:
            - Location (Coordinates): Latitude ${selectedCoords.lat.toFixed(6)}, Longitude ${selectedCoords.lng.toFixed(6)}
            - Land Size: ${dismil} dismil
            - Current Value: ₹${currentValue.toLocaleString('en-IN')}

            Based on this data and considering factors like location, potential development, and economic trends, predict the property's total value in ${years} years.

            IMPORTANT: Your response MUST be ONLY the final predicted numerical value in Indian Rupees. Do not include any text, explanation, commas, or currency symbols.
            For example, if the predicted value is 75 Lakhs, your response should be exactly: 7500000
        `;

        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                 const errorBody = await response.json();
                 throw new Error(errorBody.error?.message || `API request failed with status ${response.status}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text && !isNaN(parseFloat(text))) {
                const predictedValue = parseFloat(text.trim());
                setPrediction(predictedValue);
                
                // Save calculation to history
                if (user) {
                    const calculationData = {
                        inputs: {
                            location: { 
                                lat: selectedCoords.lat.toFixed(6), 
                                lng: selectedCoords.lng.toFixed(6) 
                            },
                            dismil: parseFloat(dismil),
                            currentValue: currentValue,
                            years: parseInt(years)
                        },
                        result: predictedValue
                    };
                    
                    const description = `Property value prediction for ${dismil} dismil in ${years} years`;
                    saveToHistory('geoPrediction', description, calculationData);
                }
            } else {
                throw new Error("Received invalid or empty response from API.");
            }
        } catch (error) {
            setError(`Prediction Failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/2 bg-gray-800 p-2 sm:p-4 rounded-xl h-[50vh] lg:h-auto min-h-[300px]">
                <MapContainer
                    center={[selectedCoords.lat, selectedCoords.lng]}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="w-full h-full rounded-lg"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
                        <Popup>Your Property Location</Popup>
                    </Marker>
                    <MapUpdater
                        coords={selectedCoords}
                        setSelectedCoords={setSelectedCoords}
                        setInstructionText={setInstructionText}
                    />
                </MapContainer>
            </div>

            <div className="lg:w-1/2 space-y-6">
                 <div className="bg-gray-800 p-6 rounded-xl space-y-4">
                    <h2 className="text-2xl text-emerald-400 font-bold">Geo-Property Predictor</h2>
                    <div className="text-sm p-3 bg-gray-900 border border-emerald-800 text-emerald-300 rounded flex justify-between items-center">
                        <span>{instructionText}</span>
                        <button onClick={centerOnUserLocation} className="ml-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-2 rounded whitespace-nowrap">
                            My Location
                        </button>
                    </div>
                    {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded text-sm">{error}</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <input type="number" value={dismil} onChange={(e) => setDismil(e.target.value)} placeholder="Dismil" className="form-input" />
                         <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price/dismil (₹)" className="form-input" />
                         <input type="number" value={years} onChange={(e) => setYears(e.target.value)} placeholder="Years" className="form-input" />
                    </div>
                    {currentValue > 0 && (
                        <div className="text-center text-emerald-400 text-xl pt-2">Current Value: ₹{currentValue.toLocaleString('en-IN')}</div>
                    )}
                    <button onClick={getPrediction} disabled={!isButtonEnabled || isLoading} className="predict-button">
                        {isLoading ? "Predicting..." : "Predict Future Value"}
                    </button>
                </div>

                {prediction !== null && (
                    <div className="bg-gray-800 p-6 rounded-xl text-center animate-fade-in">
                        <h2 className="text-lg text-emerald-400 font-semibold">Predicted Value in {years} Years</h2>
                        <p className="text-4xl font-bold text-white mt-2">₹{prediction.toLocaleString('en-IN')}</p>
                    </div>
                )}
            </div>

            <style>{`
                .form-input {
                    width: 100%; padding: 0.75rem; background-color: #1F2937;
                    color: white; border: 1px solid #4B5563; border-radius: 0.5rem;
                }
                .form-input:focus {
                    outline: none; border-color: #10B981;
                    box-shadow: 0 0 0 2px #10B98133;
                }
                .predict-button {
                    background-color: #10B981; color: white; padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem; width: 100%; font-weight: bold;
                    cursor: pointer; transition: background-color 0.2s;
                }
                .predict-button:hover:not(:disabled) { background-color: #059669; }
                .predict-button:disabled { background-color: #4B5563; cursor: not-allowed; }
                .leaflet-container { font-family: 'Inter', sans-serif; }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type="number"] { -moz-appearance: textfield; }
            `}</style>
        </div>
    );
}

export default GeoPredictorCard;