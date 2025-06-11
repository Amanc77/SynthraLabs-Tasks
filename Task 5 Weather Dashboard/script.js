const wrapper = document.querySelector(".wrapper"),
  inputPart = document.querySelector(".input-part"),
  infoTxt = inputPart.querySelector(".info-txt"),
  inputField = inputPart.querySelector("input"),
  locationBtn = inputPart.querySelector(".location-btn"),
  searchBtn = inputPart.querySelector(".search-btn"),
  weatherPart = wrapper.querySelector(".weather-part"),
  wIcon = weatherPart.querySelector("img"),
  arrowBack = wrapper.querySelector("header i"),
  themeToggle = document.querySelector("#themeToggle"),
  unitToggle = document.querySelector("#unitToggle"),
  saveFavoriteBtn = document.querySelector("#saveFavorite"),
  favoritesList = document.querySelector(".favorites-list");

let latitude, longitude;
let api;
let isCelsius = true;
let currentWeatherData = null;
let favoriteLocations =
  JSON.parse(localStorage.getItem("favoriteLocations")) || [];

function initializeApp() {
  loadTheme();
  updateUnitButton();
  renderFavorites();
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.className = savedTheme + "-theme";
  themeToggle.innerHTML =
    savedTheme === "dark"
      ? '<i class="bx bx-sun"></i>'
      : '<i class="bx bx-moon"></i>';
}

function updateUnitButton() {
  unitToggle.textContent = isCelsius ? "°C" : "°F";
}

function convertTemperature(temp) {
  return isCelsius ? temp : (temp * 9) / 5 + 32;
}

function renderFavorites() {
  favoritesList.innerHTML = favoriteLocations
    .map(
      (loc) => `
    <div class="favorite-item">
      <span>${loc}</span>
      <button class="remove-favorite" data-city="${loc}">×</button>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".favorite-item span").forEach((item) => {
    item.addEventListener("click", () => requestApi(item.textContent));
  });

  document.querySelectorAll(".remove-favorite").forEach((btn) => {
    btn.addEventListener("click", () => {
      favoriteLocations = favoriteLocations.filter(
        (city) => city !== btn.dataset.city
      );
      localStorage.setItem(
        "favoriteLocations",
        JSON.stringify(favoriteLocations)
      );
      renderFavorites();
    });
  });
}

themeToggle.addEventListener("click", () => {
  const newTheme = document.body.className.includes("light") ? "dark" : "light";
  document.body.className = newTheme + "-theme";
  localStorage.setItem("theme", newTheme);
  themeToggle.innerHTML =
    newTheme === "dark"
      ? '<i class="bx bx-sun"></i>'
      : '<i class="bx bx-moon"></i>';
});

unitToggle.addEventListener("click", () => {
  isCelsius = !isCelsius;
  updateUnitButton();
  if (currentWeatherData) updateWeatherDisplay(currentWeatherData);
});

saveFavoriteBtn.addEventListener("click", () => {
  const city = weatherPart
    .querySelector(".location span")
    .textContent.split(",")[0]
    .trim();
  if (city && !favoriteLocations.includes(city) && city !== "_") {
    favoriteLocations.push(city);
    localStorage.setItem(
      "favoriteLocations",
      JSON.stringify(favoriteLocations)
    );
    renderFavorites();
  }
});

inputField.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && inputField.value !== "")
    requestApi(inputField.value);
});

searchBtn.addEventListener("click", () => {
  if (inputField.value !== "") requestApi(inputField.value);
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  } else {
    alert("Your browser does not support geolocation API");
  }
});

function requestApi(city) {
  api = `https://api.weatherapi.com/v1/current.json?key=3ffd84975bd04c10b55190700241702&q=${encodeURIComponent(
    city
  )}`;
  fetchData();
  requestForecastApi(city);
}

function onSuccess(position) {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;
  const coords = `${latitude},${longitude}`;
  api = `https://api.weatherapi.com/v1/current.json?key=3ffd84975bd04c10b55190700241702&q=${coords}`;
  fetchData();
  requestForecastApi(coords);
}

function requestForecastApi(city) {
  api = `https://api.weatherapi.com/v1/forecast.json?key=3ffd84975bd04c10b55190700241702&q=${encodeURIComponent(
    city
  )}&days=7`;
  fetchForecastData();
}

function onError(error) {
  infoTxt.innerText = error.message;
  infoTxt.classList.add("error");
}

function fetchData() {
  infoTxt.innerText = "Getting weather details...";
  infoTxt.classList.add("pending");
  fetch(api)
    .then((res) => res.json())
    .then((result) => weatherDetails(result))
    .catch(() => {
      infoTxt.innerText = "Something went wrong";
      infoTxt.classList.replace("pending", "error");
    });
}

function fetchForecastData() {
  fetch(api)
    .then((res) => res.json())
    .then((result) => forecastDetails(result))
    .catch(() => {
      infoTxt.innerText = "Something went wrong";
      infoTxt.classList.replace("pending", "error");
    });
}

function updateWeatherDisplay(info) {
  weatherPart.querySelector(".temp .numb").innerText = Math.floor(
    convertTemperature(info.current.temp_c)
  );
  weatherPart.querySelector(".temp .unit").innerText = isCelsius ? "C" : "F";
  weatherPart.querySelector(".temp .numb-2").innerText = Math.floor(
    convertTemperature(info.current.feelslike_c)
  );
  weatherPart.querySelector(".weather-part .unit").innerText = isCelsius
    ? "C"
    : "F";
}

function weatherDetails(info) {
  if (info.error) {
    infoTxt.classList.replace("pending", "error");
    infoTxt.innerText = `${inputField.value} isn't a valid city name`;
  } else {
    currentWeatherData = info;
    const city = info.location.name;
    const country = info.location.country;
    const description = info.current.condition.text;
    const humidity = info.current.humidity;
    const wind_kph = info.current.wind_kph;
    const wind_dir = info.current.wind_dir;
    const vis_km = info.current.vis_km;
    const pressure_mb = info.current.pressure_mb;
    const uv = info.current.uv;

    wIcon.src = getWeatherIcon(description);
    weatherPart.querySelector(".temp .numb").innerText = Math.floor(
      convertTemperature(info.current.temp_c)
    );
    weatherPart.querySelector(".temp .unit").innerText = isCelsius ? "C" : "F";
    weatherPart.querySelector(".weather").innerText = description;
    weatherPart.querySelector(
      ".location span"
    ).innerText = `${city}, ${country}`;
    weatherPart.querySelector(".temp .numb-2").innerText = Math.floor(
      convertTemperature(info.current.feelslike_c)
    );
    weatherPart.querySelector(".weather-part .unit").innerText = isCelsius
      ? "C"
      : "F";
    weatherPart.querySelector(".humidity span").innerText = `${humidity}%`;
    weatherPart.querySelector(
      ".wind span"
    ).innerText = `${wind_kph} kph ${wind_dir}`;
    weatherPart.querySelector(".uv span").innerText = uv;
    weatherPart.querySelector(".vis span").innerText = vis_km;
    weatherPart.querySelector(".pressure_mb span").innerText = pressure_mb;

    infoTxt.classList.remove("pending", "error");
    infoTxt.innerText = "";
    inputField.value = "";
    wrapper.classList.add("active");
  }
}

function getWeatherIcon(description) {
  const iconBase = "./icons/";
  const desc = description.toLowerCase();
  if (desc.includes("rain")) return `${iconBase}rain.svg`;
  if (desc.includes("storm")) return `${iconBase}storm.svg`;
  if (desc.includes("snow")) return `${iconBase}snow.svg`;
  if (desc.includes("haze")) return `${iconBase}haze.svg`;
  if (desc.includes("cloud")) return `${iconBase}cloud.svg`;
  return `${iconBase}clear.svg`;
}

arrowBack.addEventListener("click", () => {
  wrapper.classList.remove("active");
});

// Modal Handling
const modal = document.getElementById("myModal");
const btn = document.getElementById("openModal");
const span = document.getElementById("closeModal");

btn.onclick = () => (modal.style.display = "block");
span.onclick = () => (modal.style.display = "none");
window.onclick = (event) => {
  if (event.target === modal) modal.style.display = "none";
};

function forecastDetails(info) {
  document.querySelector(".forecast").innerHTML = "";
  document.querySelector(".hourly-container").innerHTML = "";

  if (info.error) {
    infoTxt.classList.replace("pending", "error");
    infoTxt.innerText = `${inputField.value} isn't a valid city name`;
  } else {
    const forecast = info.forecast.forecastday;
    forecast.forEach((day, index) => {
      if (index < 7) {
        const date = new Date(day.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const temp = convertTemperature(day.day.avgtemp_c);
        const humidity = day.day.avghumidity;
        const condition = day.day.condition.text;

        const forecastElement = document.createElement("div");
        forecastElement.classList.add("day");
        forecastElement.innerHTML = `
          <img src="${getWeatherIcon(condition)}" alt="${condition}">
          <h2>${date}</h2>
          <p>Temp: ${Math.floor(temp)}°${isCelsius ? "C" : "F"}</p>
          <p>Humidity: ${humidity}%</p>
        `;
        document.querySelector(".forecast").appendChild(forecastElement);
      }
    });

    const hourly = info.forecast.forecastday[0].hour.slice(0, 12);
    hourly.forEach((hour, index) => {
      if (index % 2 === 0) {
        const time = new Date(hour.time).toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        });
        const temp = convertTemperature(hour.temp_c);
        const condition = hour.condition.text;

        const hourElement = document.createElement("div");
        hourElement.classList.add("hour");
        hourElement.innerHTML = `
          <p>${time}</p>
          <img src="${getWeatherIcon(condition)}" alt="${condition}">
          <p>${Math.floor(temp)}°${isCelsius ? "C" : "F"}</p>
        `;
        document.querySelector(".hourly-container").appendChild(hourElement);
      }
    });
  }
}

initializeApp();
