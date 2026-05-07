import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const VANCOUVER_LAT = 49.2827;
const VANCOUVER_LNG = -123.1207;

// ------------------------------------------------------------
// Global app state
// ------------------------------------------------------------
const appState = {
  userLngLat: null,
};

// ------------------------------------------------------------
// Initialize map, controls, and geolocation
// ------------------------------------------------------------
function showMap() {
  const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.00163752324765, 49.25324576104826],
    zoom: 10,
  });

  addControls(map);

  map.once("load", async () => {
    await addParksLayer(map);
    await addCommunityCentresLayer(map);
    updateMapUv(VANCOUVER_LAT, VANCOUVER_LNG, map);

    const geolocate = addGeolocationControl(map);

    geolocate.once("geolocate", async (e) => {
      const { longitude, latitude } = e.coords;
      appState.userLngLat = [longitude, latitude];

      map.flyTo({
        center: [longitude, latitude],
        zoom: 13,
        speed: 1.2,
      });

      console.log("User located:", appState.userLngLat);
    });

    geolocate.on("error", (e) => {
      console.warn("Geolocation error:", e.message);
    });

    geolocate.trigger();

    console.log("Map loaded!");
  });
}

// ------------------------------------------------------------
// Add zoom + rotation controls
// ------------------------------------------------------------
function addControls(map) {
  map.addControl(new maplibregl.NavigationControl(), "top-right");
}

// ------------------------------------------------------------
// Fetch Vancouver parks GeoJSON and add polygon + outline layers
// ------------------------------------------------------------
async function addParksLayer(map) {
  try {
    const res = await fetch("/api/parks");
    const geojson = await res.json();

    // Add GeoJSON source
    map.addSource("vancouver-parks", {
      type: "geojson",
      data: geojson,
    });

    // Filled polygon layer
    map.addLayer({
      id: "parks-fill",
      type: "fill",
      source: "vancouver-parks",
      paint: {
        "fill-color": "#4caf50",
        "fill-opacity": 0.3,
      },
    });

    // Outline layer
    map.addLayer({
      id: "parks-outline",
      type: "line",
      source: "vancouver-parks",
      paint: {
        "line-color": "#2e7d32",
        "line-width": 1.5,
      },
    });

    // Popup on click
    map.on("click", "parks-fill", (e) => {
      const props = e.features[0].properties;
      console.log(props);
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${props.park_name}</strong>`)
        .addTo(map);
    });

    // Pointer cursor on hover
    map.on("mouseenter", "parks-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "parks-fill", () => {
      map.getCanvas().style.cursor = "";
    });

    console.log("Parks layer loaded!");
  } catch (err) {
    console.error("Failed to load parks data:", err);
  }
}

async function addCommunityCentresLayer(map) {
  try {
    const res = await fetch("/api/cooling-centres");
    const geojson = await res.json();

    map.addSource("vancouver-community-centres", {
      type: "geojson",
      data: geojson,
    });

    const image = await map.loadImage("/snowflake.png");
    map.addImage("snowflake", image.data);

    // Circle marker for each community centre
    map.addLayer({
      id: "community-centres-circle",
      type: "symbol",
      source: "vancouver-community-centres",
      layout: {
        "icon-image": "snowflake",
        "icon-size": 0.05,
      },
    });

    // Popup on click
    map.on("click", "community-centres-circle", (e) => {
      const props = e.features[0].properties;
      console.log(props); // check field names
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${props.name}</strong>`)
        .addTo(map);
    });

    map.on("mouseenter", "community-centres-circle", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "community-centres-circle", () => {
      map.getCanvas().style.cursor = "";
    });

    console.log("Community centres layer loaded!");
  } catch (err) {
    console.error("Failed to load community centres data:", err);
  }
}

// ------------------------------------------------------------
// Add geolocation control and return it for external use
// ------------------------------------------------------------
function addGeolocationControl(map) {
  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  });

  map.addControl(geolocate, "top-right");
  return geolocate;
}

// ------------------------------------------------------------
// Try to get location first, then init map centered on user
// ------------------------------------------------------------
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const { longitude, latitude } = pos.coords;
    appState.userLngLat = [longitude, latitude];
    showMap([longitude, latitude], 13);
  },
  (err) => {
    console.warn("Location denied, using default:", err.message);
    showMap();
  },
  { enableHighAccuracy: true },
);

async function updateMapUv(lat, lng, map) {
  try {
    const response = await fetch(`/api/uv?lat=${lat}&lng=${lng}`);
    const data = await response.json();
    console.log("Data from my server:", data);

    const uvEl = document.getElementById("uv");
    if (uvEl) uvEl.textContent = `UV: ${data.uvIndex} (${data.riskLevel})`;

    document.getElementById("temp").textContent = `${data.temperature}°C`;

    // Update parks color based on open-meteo data
    map.setPaintProperty("parks-fill", "fill-color", data.colour);
    map.setPaintProperty("parks-outline", "line-color", data.colour);
  } catch (error) {
    console.error("Error connecting to backend:", error);
  }
}
