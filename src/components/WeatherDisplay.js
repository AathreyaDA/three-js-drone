import { useRef, useState } from "react";

const WeatherDisplay = () => {
    const data = useRef({});

    // const fetchWeatherData = () => {
    //     // fetch(`https://api.openweathermap.org/data/2.5/weather?lat=12.9716&lon=77.5946&appid=${process.env.REACT_APP_API_KEY}`)
    //     fetch(`https://api.open-meteo.com/v1/forecast?latitude=12.9352&longitude=77.5355&hourly=temperature_1000hPa,temperature_925hPa,temperature_850hPa,wind_speed_1000hPa,wind_speed_925hPa,wind_speed_850hPa,wind_direction_1000hPa,wind_direction_925hPa,wind_direction_850hPa&forecast_hours=1&timezone=Asia%2FKolkata`)
    //         .then((res) => {
    //             if (!res.ok) {
    //                 throw new Error(`HTTP error! status: ${res.status}`);
    //             }
    //             return res.json(); // Important: Return the promise from res.json()
    //         })
    //         .then((json) => {
    //             data.current = json.hourly;
    //             console.log("Weather Data:", data.current); // Log the data here, after it's been fetched
    //         })
    //         .catch((err) => console.error("Fetch error:", err));

    //     // console.log("Link: " + `https://api.openweathermap.org/data/2.5/weather?lat=12.9716&lon=77.5946&appid=${process.env.REACT_APP_API_KEY}`);
    // };

    const lat = 12.9352;
    const lon = 77.5351;
    const elevations = [842, 875, 900, 925, 950, 975];

    const baseUrl = 'https://api.open-meteo.com/v1/forecast';

    const params = (elev) =>
    `${baseUrl}?latitude=${lat}&longitude=${lon}&elevation=${elev}&current=temperature_2m,windspeed_10m,winddirection_10m`;

    async function fetchWeather() {
    try {
        const promises = elevations.map((elev) =>
        fetch(params(elev)).then((res) => res.json())
        );

        const results = await Promise.all(promises);

        results.forEach((data, i) => {
        const elev = elevations[i];
        const { temperature_2m, windspeed_10m, winddirection_10m } = data.current;
        console.log(
            `Elevation ${elev}m:\n  Temp: ${temperature_2m}°C\n  Wind: ${windspeed_10m} km/h @ ${winddirection_10m}°\n`
        );
        });
    } catch (err) {
        console.error('Error fetching data:', err);
    }
    }

    return (
        <div style={{ zIndex: 400, position: "absolute", top: "5px", right: "5px" }}>
            <button onClick={fetchWeather}>Click here to log</button>
        </div>
    );
};

export default WeatherDisplay;