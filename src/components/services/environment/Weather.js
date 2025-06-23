class Weather {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.elevations = [842, 875, 900, 925, 950, 975];

        this.baseUrl = 'https://api.open-meteo.com/v1/forecast';

        this.data = [];

        this.fetchWeather();
    }

    params(elev) {
        return `${this.baseUrl}?latitude=${this.latitude}&longitude=${this.longitude}&elevation=${elev}&current=temperature_2m,windspeed_10m,winddirection_10m,precipitation,rain,snowfall,weathercode`;
    }

    async fetchWeather() {
        try {
            const promises = this.elevations.map((elev) =>
                fetch(this.params(elev)).then((res) => res.json())
            );

            const results = await Promise.all(promises);
            results.forEach((result, i) => {
                const elev = this.elevations[i];
                const {
                    temperature_2m,
                    windspeed_10m,
                    winddirection_10m,
                    precipitation,
                    rain,
                    snowfall,
                    weathercode
                } = result.current;

                this.data[i] = {
                    elevation: elev,
                    temperature: temperature_2m,
                    windSpeed: windspeed_10m,
                    windDirection: winddirection_10m,
                    precipitation,
                    rain,
                    snowfall,
                    weatherCode: weathercode
                };
            });
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }
}

export default Weather;
