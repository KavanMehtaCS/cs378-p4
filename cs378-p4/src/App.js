import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [currentCity, setCurrentCity] = useState('Austin');
  const [error, setError] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [astronomyData, setAstronomyData] = useState({});
  const [customCities, setCustomCities] = useState([]);

  const cities = {
    Austin: { latitude: 30.2672, longitude: -97.7431 },
    Dallas: { latitude: 32.7767, longitude: -96.7970 },
    Houston: { latitude: 29.7604, longitude: -95.3698 },
  };

  const openMeteoAPI = 'https://api.open-meteo.com/v1/forecast';
  const geocodingAPI = 'https://geocoding-api.open-meteo.com/v1/search';
  const nasaAPI = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
  const restCountriesAPI = 'https://restcountries.com/v3.1/name/';

  // Memoize handleCityClick to ensure stable reference
  const handleCityClick = useCallback((cityName) => {
    setCurrentCity(cityName);
    const { latitude, longitude } = cities[cityName];
    fetchWeatherData(latitude, longitude);
  }, []);

  // Fetch weather data
  const fetchWeatherData = async (latitude, longitude) => {
    try {
      setError('');
      const response = await fetch(
        `${openMeteoAPI}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m`
      );
      if (!response.ok) throw new Error('Failed to fetch weather data.');
      const data = await response.json();
      setWeatherData(data.hourly.temperature_2m.slice(0, 12));
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch NASA Astronomy Picture of the Day
  const fetchAstronomyData = async () => {
    try {
      setError('');
      const response = await fetch(nasaAPI);
      if (!response.ok) throw new Error('Failed to fetch NASA data.');
      const data = await response.json();
      setAstronomyData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch country information using REST Countries API

  // Add custom city
  const handleAddCity = async () => {
    if (!cityInput.trim()) return;

    try {
      setError('');
      const response = await fetch(`${geocodingAPI}?name=${cityInput.trim()}`);
      if (!response.ok) throw new Error('Failed to fetch city coordinates.');
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { latitude, longitude } = data.results[0];
        setCustomCities([...customCities, { name: cityInput.trim(), latitude, longitude }]);
        setCurrentCity(cityInput.trim());
        fetchWeatherData(latitude, longitude);
        setCityInput('');
      } else {
        throw new Error(`Could not find weather for "${cityInput.trim()}".`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Load Austin's weather and NASA image on initial render
  useEffect(() => {
    handleCityClick('Austin');
    fetchAstronomyData();
  }, [handleCityClick]); // Include memoized function in dependency array

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px', backgroundColor: '#f9f9f9' }}>
      <h1 style={{ color: '#4CAF50' }}>Weather & Astronomy App</h1>

      {/* City Buttons */}
      <div>
        {Object.keys(cities).map((city) => (
          <button
            key={city}
            onClick={() => handleCityClick(city)}
            style={{
              marginRight: '10px',
              padding: '10px',
              backgroundColor: currentCity === city ? '#4CAF50' : '#f0f0f0',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {city}
          </button>
        ))}
        {customCities.map((customCity) => (
          <button
            key={customCity.name}
            onClick={() => handleCityClick(customCity.name)}
            style={{
              marginRight: '10px',
              padding: '10px',
              backgroundColor: currentCity === customCity.name ? '#4CAF50' : '#f0f0f0',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {customCity.name}
          </button>
        ))}
      </div>

      {/* Add Custom City */}
      <div style={{ marginTop: '20px' }}>
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="Enter city name"
          style={{ padding: '10px', marginRight: '10px', width: '200px' }}
        />
        <button onClick={handleAddCity} style={{ padding: '10px', cursor: 'pointer' }}>
          +
        </button>
      </div>

      {/* Error Message */}
      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

      {/* Weather Data Visualization */}
      <div style={{ marginTop: '20px' }}>
        <h2>Hourly Forecast for {currentCity}</h2>
        <Line
          data={{
            labels: Array.from({ length: weatherData.length }, (_, i) => `${i + 1}:00`),
            datasets: [
              {
                label: 'Temperature (°C)',
                data: weatherData,
                fill: false,
                backgroundColor: '#4CAF50',
                borderColor: '#4CAF50',
              },
            ],
          }}
        />
      </div>

      {/* Astronomy Data */}
      {astronomyData && (
        <div>
          <h2>Astronomy Picture of the Day</h2>
          <img src={astronomyData.url} alt={astronomyData.title} style={{ width: '100%' }} />
          <p>{astronomyData.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default App;
