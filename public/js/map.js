const VANCOUVER_LAT = 49.2827;
const VANCOUVER_LNG = -123.1207;

let isClicked = false;

const drawer = document.getElementById("drawer");
const drawerTitle = document.getElementById("drawer-title");
const drawerContent = document.getElementById("drawer-content");

function openDrawer(title, content) {
  drawer.classList.remove("open");
  setTimeout(() => {
    drawerTitle.textContent = title;
    drawerContent.innerHTML = content;
    drawer.classList.add("open");
  }, 300);
}

function escapeHtml(text) {
  if (text == null || text === undefined) {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * Fetch a map item by id and open the drawer (used by map clicks and search results).
 * @param {string} mapItemId
 */
async function openDrawerForMapItem(mapItemId) {
  try {
    const res = await fetch(`/api/locations/${encodeURIComponent(mapItemId)}`);
    if (!res.ok) {
      console.warn("Location not found:", mapItemId);
      return;
    }
    const loc = await res.json();

    let title;
    let content;

    const parkName = loc.park_name != null ? String(loc.park_name).trim() : "";

    if (parkName !== "") {
      title = parkName;
      const neighbourhoodLine = loc.neighbourhood_name
        ? `<p class="mb-2">${escapeHtml(loc.neighbourhood_name)}</p>`
        : "";
      const ha = loc.hectare ?? loc.hectares;
      const hectaresLine =
        ha != null ? `<p class="text-sm text-gray-600">${escapeHtml(String(ha))} ha</p>` : "";
      const nbLink =
        loc.neighbourhood_url
          ? `<p class="mt-2"><a href="${escapeHtml(loc.neighbourhood_url)}" target="_blank" rel="noopener noreferrer" class="underline text-blue-600">Neighbourhood info</a></p>`
          : "";
      content = `${neighbourhoodLine}${hectaresLine}${nbLink}`;
    } else if (loc.name != null && loc.address != null) {
      title = loc.name;
      content = `<ul class="list-disc pl-5 space-y-1">
          <li>${escapeHtml(loc.address)}</li>
          <li>${escapeHtml(loc.type)}</li>
        </ul>`;
    } else {
      title = loc.name || loc.park_name || "Location";
      content = `<p class="text-sm text-gray-600">Details for this location are limited.</p>`;
    }

    openDrawer(title, content);

    const map = window.appMap;
    if (!map) {
      return;
    }

    const coordRes = await fetch(
      `/api/cooling-centres/location/${encodeURIComponent(mapItemId)}`
    );
    if (!coordRes.ok) {
      return;
    }
    const coords = await coordRes.json();
    if (Array.isArray(coords) && coords.length > 0 && coords[0].long != null && coords[0].lat != null) {
      map.flyTo({
        center: [coords[0].long, coords[0].lat],
        zoom: 14,
        speed: 1.2,
      });
    }
  } catch (err) {
    console.error("openDrawerForMapItem:", err);
  }
}

window.openDrawerForMapItem = openDrawerForMapItem;

function closeDrawer() {
  drawer.classList.remove("open");
}
window.closeDrawer = closeDrawer; // Make globally accessible for inline onclick

// ------------------------------------------------------------
// Global app state
// ------------------------------------------------------------
const appState = {
  userLngLat: null,
};

// ------------------------------------------------------------
// Initialize map, controls, and geolocation
// ------------------------------------------------------------
function showMap(center = [VANCOUVER_LNG, VANCOUVER_LAT], zoom = 12) {
  const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${window.MAPTILER_KEY}`,
    center: center,
    zoom: zoom,
  });

  window.appMap = map;

  addControls(map);

  map.once("load", async () => {
    await addParksLayer(map);
    await addCoolingCentresLayer(map);

    // Use user location for UV if available, otherwise use map center
    const uvLat = appState.userLngLat ? appState.userLngLat[1] : VANCOUVER_LAT;
    const uvLng = appState.userLngLat ? appState.userLngLat[0] : VANCOUVER_LNG;
    await updateMapUv(uvLat, uvLng, map);

    // Clicking outside of drawer or clicking a marker/shaded area closes it
    map.on("click", (e) => {
      if (!isClicked) {
        closeDrawer();
      }
      isClicked = false;
    });

    // Close button
    const drawerClose = document.getElementById("drawer-close");
    drawerClose.addEventListener("click", closeDrawer);

    const geolocate = addGeolocationControl(map);

    geolocate.once("geolocate", async (e) => {
      const { longitude, latitude } = e.coords;
      appState.userLngLat = [longitude, latitude];

      // Update UV with user's actual location
      await updateMapUv(latitude, longitude, map);

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

    // Show drawer on click
    map.on("click", "parks-fill", (e) => {
      isClicked = true;
      const props = e.features[0].properties;
      console.log(props);
      openDrawer(
        props.park_name,
        `<a href=${props.park_url} target="_blank" class="underline">Visit website<a/>`,
      );
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

// Fetch cooling centres from database and add markers
async function addCoolingCentresLayer(map) {
  try {
    const res = await fetch("/api/cooling-centres");
    const data = await res.json();

    const coordPromises = data.map((c) =>
      fetch(`/api/cooling-centres/location/${c.map_item_id}`)
        .then((r) => r.json())
        .then((coords) => ({ centre: c, coords }))
        .catch(() => ({ centre: c, coords: null }))
    );

    const results = await Promise.all(coordPromises);

    const features = results
      .filter((r) => r.coords && r.coords.length > 0)
      .map((r) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [r.coords[0].long, r.coords[0].lat],
        },
        properties: {
          map_item_id: r.centre.map_item_id,
          name: r.centre.name,
          address: r.centre.address,
          type: r.centre.type,
        },
      }));

    if (features.length === 0) {
      console.warn("No cooling centre coordinates found");
      return;
    }

    const geojson = {
      type: "FeatureCollection",
      features: features,
    };

    map.addSource("cooling-centres", {
      type: "geojson",
      data: geojson,
    });

    // Try to load custom icon, fall back to circle if not available
    try {
      const image = await map.loadImage("/img/map-loc_cooling.png");
      map.addImage("cooling-icon", image.data);

      map.addLayer({
        id: "cooling-centres-layer",
        type: "symbol",
        source: "cooling-centres",
        layout: {
          "icon-image": "cooling-icon",
          "icon-size": 0.25,
          "icon-allow-overlap": true,
        },
      });
    } catch (imgErr) {
      // Fallback to circle markers if image not found
      map.addLayer({
        id: "cooling-centres-layer",
        type: "circle",
        source: "cooling-centres",
        paint: {
          "circle-radius": 8,
          "circle-color": "#00a9f5",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    }

    map.on("click", "cooling-centres-layer", (e) => {
      isClicked = true;
      const props = e.features[0].properties;
      openDrawer(
        props.name,
        `<ul>
          <li>${props.address}</li>
          <li>${props.type}</li>
        </ul>`
      );
    });

    map.on("mouseenter", "cooling-centres-layer", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "cooling-centres-layer", () => {
      map.getCanvas().style.cursor = "";
    });

    console.log(`Cooling centres loaded: ${features.length} locations`);
  } catch (err) {
    console.error("Failed to load cooling centres:", err);
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

// Fetch UV index and update map + UI
async function updateMapUv(lat, lng, map) {
  try {
    const response = await fetch(`/api/uv?lat=${lat}&lng=${lng}`);
    const data = await response.json();

    const uvEl = document.getElementById("uv");
    if (uvEl) {
      const roundedUv = Math.round(data.uvIndex);
      uvEl.textContent = `UV: ${roundedUv} (${data.riskLevel})`;
    }

    const tempEl = document.getElementById("temp");
    if (tempEl) {
      tempEl.textContent = `${data.temperature}°C`;
    }

    // Update park colour based on UV risk
    if (map.getLayer("parks-fill")) {
      map.setPaintProperty("parks-fill", "fill-color", data.colour);
      map.setPaintProperty("parks-outline", "line-color", data.colour);
    }
  } catch (error) {
    console.error("Error fetching UV data:", error);
  }
}