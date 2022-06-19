var currentWeather;
var forecastWeather;
var errorMsg = document.getElementById("errorMsg");
var userInput = document.getElementById("userInput");
var celsius = document.getElementById('celsius');
var fahrenheit = document.getElementById('fahrenheit');
var userChoice;
var selectedUnit = celsius.checked ? "metric" : "imperial";
var degrees = celsius.checked ? "°C" : "°F";
var weatherIsFromGeo = null;
var forecastIsFromGeo = null;
var position = {};

async function getWeatherData(method) {
    try {
        let myURL = getAPIURL(method, "weather");
        const res = await fetch(myURL);
        if (res.status === 200) {
            errorMsg.style.display = "none";
            currentWeather = await res.json();
            displayCurrentWeather(currentWeather);
            initMap(method)
        } else if (res.status === 404) {
            errorMsg.style.display = "block";
            errorMsg.innerText = "Orașul nu a fost găsit";
        }
    } catch (err) {
        console.log(err)
    }
}

async function getForecastData(method) {
    try {
        let myURL = getAPIURL(method, "forecast");
        const res = await fetch(myURL);
        if (res.status === 200) {
            errorMsg.style.display = "none";
            forecastWeather = await res.json();
            displayForecastWeather(forecastWeather);
        } else if (res.status === 404) {
            errorMsg.style.display = "block";
            errorMsg.innerText = "Orașul nu a fost găsit";
        }
    } catch (err) {
        console.log(err)
    }
}

function getAPIURL(method, requestType) {
    let myURL = '';
    switch (method) {
        case "geolocation":
            myURL = `https://api.openweathermap.org/data/2.5/${requestType}?appid=69518b1f8f16c35f8705550dc4161056&lang=ro&units=${selectedUnit}&lat=${position.latitude}&lon=${position.longitude}`;
            if (requestType === "weather"){
                weatherIsFromGeo = true;
            }
            if (requestType === "forecast"){
                forecastIsFromGeo = true;
            }
            break;
        case "search":
            myURL = `https://api.openweathermap.org/data/2.5/${requestType}?appid=69518b1f8f16c35f8705550dc4161056&lang=ro&units=${selectedUnit}&q=${userInput.value}`;
            if (requestType === "weather"){
                weatherIsFromGeo = false;
            }
            if (requestType === "forecast"){
                forecastIsFromGeo = false;
            }
            break;
    } return myURL
}

window.onload = () => {
    // getUserChoiceViaCookies();
    getUserChoiceViaStorage();
    selectedUnit = celsius.checked ? "metric" : "imperial";
    degrees = celsius.checked ? "°C" : "°F";
    navigator.geolocation.getCurrentPosition(successGeoCallback, errorGeoCallback);
}

const successGeoCallback = (receivedPosition) => {
    position = receivedPosition.coords;
    getWeatherData("geolocation");
    getForecastData("geolocation");
}

const errorGeoCallback = () => {
    console.log("Unable to get weather based on location.");
}

document.getElementById("unitsWrapper").addEventListener("change", (e) => {
    selectedUnit = celsius.checked ? "metric" : "imperial";
    degrees = celsius.checked ? "°C" : "°F";
    // Cookies
    document.cookie = `units=${selectedUnit}`;
    // Local storage
    localStorage.setItem('units', `${selectedUnit}`);
    updateUnits();
})

document.getElementById("showCurrentWeather").addEventListener("click", (e) => {
    e.preventDefault();
    autoCorrect(userInput.value);
    if (validateSearch(userInput.value)) {
        getWeatherData("search");
    }
})

document.getElementById("showForecast").addEventListener("click", (e) => {
    e.preventDefault();
    autoCorrect(userInput.value);
    if (validateSearch(userInput.value)) {
        getForecastData("search");
    }

})

function getUserChoiceViaCookies() {
    if (document.cookie.includes('units')) {
        userChoice = document.cookie.split('=')[1];
        if (userChoice === 'metric') {
            celsius.checked = true
        } else if (userChoice === 'imperial') {
            fahrenheit.checked = true
        }
    } else {
        celsius.checked = true
    }
}

function getUserChoiceViaStorage() {
    if (localStorage.getItem('units') !== null) {
        userChoice = localStorage.getItem('units');
        if (userChoice === 'metric') {
            celsius.checked = true
        } else if (userChoice === 'imperial') {
            fahrenheit.checked = true
        }
    } else {
        celsius.checked = true
    }
}

function updateUnits() {
    if (weatherIsFromGeo !== null) {
        weatherIsFromGeo ? getWeatherData("geolocation") : getWeatherData("search");
    }
    if (forecastIsFromGeo !== null) {
        forecastIsFromGeo ? getForecastData("geolocation") : getForecastData("search");
    }
}

function autoCorrect(input) {
    if (input.toUpperCase() === "BUCURESTI") {
        userInput.value = "București";
    }
};

function displayCurrentWeather(currentWeather) {
    const currentWeatherHeader = document.querySelector("#currentWeatherWrapper h3 span");
    const infoList = document.querySelectorAll("#infoList ul li span");

    currentWeatherHeader.innerText = ` în ${currentWeather.name}, ${currentWeather.sys.country}`;
    infoList[0].innerHTML = `<img src="http://openweathermap.org/img/w/${currentWeather.weather[0].icon}.png" alt="current weather icon">`;
    infoList[1].innerHTML = currentWeather.weather[0].description;
    infoList[2].innerHTML = `${currentWeather.main.humidity} %`;
    infoList[3].innerHTML = `${currentWeather.main.pressure} milibari (${(currentWeather.main.pressure * 0.75006375541921).toFixed(2)} mmHg)`;
    infoList[4].innerHTML = `${currentWeather.main.temp} ${degrees}`;
    infoList[5].innerHTML = `${currentWeather.main.temp_min} ${degrees}`;
    infoList[6].innerHTML = `${currentWeather.main.temp_max} ${degrees}`;
}

function initMap(method) {
    var currentCity
    switch (method) {
        case "geolocation":
            currentCity = { lat: position.latitude, lng: position.longitude };
            break;
        case "search":
            currentCity = { lat: currentWeather.coord.lat, lng: currentWeather.coord.lon };
            break;
    }
    // map options
    var options = {
        zoom: 12,
        center: currentCity
    }
    // new map
    map = new google.maps.Map(document.getElementById('map'), options);
    // add marker
    var marker = new google.maps.Marker({
        position: currentCity,
        map: map
    })
}

function displayForecastWeather(forecastWeather) {
    const forecastWeatherHeader = document.querySelector("#forecastWrapper h3 span");
    const hourlyForecastTable = document.getElementById("hourlyForecastTbody");
    moment.locale('ro');

    forecastWeatherHeader.innerText = ` în ${forecastWeather.city.name}, ${forecastWeather.city.country}`;
    hourlyForecastTable.innerHTML = "";

    var itemTimeUTC = moment.utc(forecastWeather.list[0].dt_txt);
    hourlyForecastTable.innerHTML += `<tr class="hourlyForecastDate">
                <td colspan="4">${moment(itemTimeUTC).local().format('dddd' + ', ' + 'LL')}</td>
            </tr>
            <tr class="hourlyForecastItem">
                <td>${moment(itemTimeUTC).local().format('LT')}</td>
                <td><img src="http://openweathermap.org/img/w/${forecastWeather.list[0].weather[0].icon}.png"></td>
                <td><span>${forecastWeather.list[0].main.temp}${degrees}</span></td>
                <td>${forecastWeather.list[0].weather[0].description}</td>
            </tr>`;

    for (var i = 1; i < forecastWeather.list.length; i++) {
        var itemTimeUTC = moment.utc(forecastWeather.list[i].dt_txt);
        if (moment(itemTimeUTC).local().format('LT') != "0:00") {
            hourlyForecastTable.innerHTML += `<tr class="hourlyForecastItem">
                <td>${moment(itemTimeUTC).local().format('LT')}</td>
                <td><img src="http://openweathermap.org/img/w/${forecastWeather.list[i].weather[0].icon}.png"></td>
                <td><span>${forecastWeather.list[i].main.temp}${degrees}</span></td>
                <td>${forecastWeather.list[i].weather[0].description}</td>
            </tr>`;
        } else {
            hourlyForecastTable.innerHTML += `<tr class="hourlyForecastDate">
                    <td colspan="4">${moment(itemTimeUTC).local().format('dddd' + ', ' + 'LL')}</td>
                </tr>
                <tr class="hourlyForecastItem">
                    <td>${moment(itemTimeUTC).local().format('LT')}</td>
                    <td><img src="http://openweathermap.org/img/w/${forecastWeather.list[i].weather[0].icon}.png"></td>
                    <td><span>${forecastWeather.list[i].main.temp}${degrees}</span></td>
                    <td>${forecastWeather.list[i].weather[0].description}</td>
                </tr>`;
        }
    }
}

function validateSearch(userInput) {
    if (userInput === "") {
        errorMsg.style.display = "block";
        errorMsg.innerText = "Introduceți numele orașului";
        return false;
    } else return true;
}