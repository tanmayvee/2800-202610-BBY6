const VANCOUVER_LAT = 49.2827;
const VANCOUVER_LNG = -123.1207;

let isClicked = false;
let isFilterClicked = false;
let isInfoClicked = false;

const drawer = document.getElementById("drawer");
const drawerTitle = document.getElementById("drawer-title");
const drawerContent = document.getElementById("drawer-content");
const drawerCrowdingRow = document.getElementById("drawer-crowding-row");
const drawerCrowdingCount = document.getElementById("drawer-crowding-count");

function resetDrawerCrowding() {
  if (drawerCrowdingRow) {
    drawerCrowdingRow.classList.add("hidden");
  }
  if (drawerCrowdingCount) {
    drawerCrowdingCount.textContent = "—";
  }
}

/**
 * Loads crowding via get_location_crowding (SECURITY DEFINER RPC; param target_map_item_id).
 * @param {string|null|undefined} mapItemId
 */
async function refreshDrawerCrowding(mapItemId) {
  if (!drawerCrowdingRow || !drawerCrowdingCount) {
    return;
  }
  if (!mapItemId) {
    resetDrawerCrowding();
    return;
  }

  drawerCrowdingRow.classList.remove("hidden");
  drawerCrowdingCount.textContent = "…";

  try {
    const res = await fetch(
      `/api/locations/${encodeURIComponent(mapItemId)}/crowding`,
    );
    if (!res.ok) {
      drawerCrowdingCount.textContent = "?";
      return;
    }
    const body = await res.json();
    const n = typeof body.count === "number" ? body.count : Number(body.count);
    drawerCrowdingCount.textContent = Number.isFinite(n) ? String(n) : "0";
  } catch (err) {
    console.error("refreshDrawerCrowding:", err);
    drawerCrowdingCount.textContent = "?";
  }
}

window.refreshDrawerCrowding = refreshDrawerCrowding;

/**
 * @param {string} title
 * @param {string} content
 * @param {string|number|null|undefined} mapItemId Database map_item_id when known (cooling centres, search).
 * @param {string} [locationName] When set, adds a Gemini chat shortcut for this place.
 * @param {string} [locationContext] Extra context passed to chat.
 */
function openDrawer(
  title,
  content,
  mapItemId = null,
  locationName = "",
  locationContext = "",
) {
  window.currentOpenMapItemId = null;
  resetDrawerCrowding();
  drawer.classList.remove("open");
  setTimeout(() => {
    drawerTitle.textContent = title;
    drawerContent.innerHTML = content;
    drawer.classList.add("open");
    const idStr =
      mapItemId !== null && mapItemId !== undefined && String(mapItemId).trim() !== ""
        ? String(mapItemId).trim()
        : null;
    window.currentOpenMapItemId = idStr;
    refreshDrawerCrowding(idStr);

    if (locationName) {
      const buttonContainer = drawer.querySelector(".flex.flex-col.gap-2");
      if (buttonContainer) {
        const prevChat = buttonContainer.querySelector("[data-drawer-chat]");
        if (prevChat) {
          prevChat.remove();
        }
        const chatBtn = document.createElement("button");
        chatBtn.setAttribute("data-drawer-chat", "true");
        chatBtn.className =
          "bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-semibold";
        chatBtn.textContent = "Chat about this location";
        chatBtn.onclick = () => {
          if (typeof window.openChat === "function") {
            window.openChat(locationName, locationContext);
          }
        };
        buttonContainer.insertBefore(chatBtn, buttonContainer.firstChild);
      }
    }
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

    let chatName = "";
    let chatContext = "";
    if (parkName !== "") {
      chatName = parkName;
      chatContext =
        loc.neighbourhood_name != null ? String(loc.neighbourhood_name) : "";
    } else if (loc.name != null && loc.address != null) {
      chatName = String(loc.name);
      chatContext = `${loc.address} ${loc.type || ""}`;
    } else {
      chatName = loc.name != null ? String(loc.name) : parkName;
    }

    openDrawer(title, content, mapItemId, chatName, chatContext);

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
  window.currentOpenMapItemId = null;
  resetDrawerCrowding();
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

    // toggle info popup when info button is clicked
    document.getElementById("info-btn").addEventListener("click", () => {
      isInfoClicked = true;
      const popup = document.getElementById("info-popup");
      const img = document.querySelector("#info-btn img");

      popup.classList.toggle("open");
      const isOpen = popup.classList.contains("open");
      img.src = isOpen ? "/img/exit.svg" : "/img/info.svg";
    });

    // close info popup when clicking outside
    document.addEventListener("click", (e) => {
      const infoBtn = document.getElementById("info-btn");
      const infoPopup = document.getElementById("info-popup");

      if (!infoBtn.contains(e.target) && !infoPopup.contains(e.target)) {
        infoPopup.classList.remove("open");
        document.querySelector("#info-btn img").src = "/img/info.svg";
      }
    });

    // Clicking outside of drawer or clicking a marker/shaded area closes it
    map.on("click", (e) => {
      if (!isClicked) {
        closeDrawer();
      }
      document.getElementById("filter-drawer").classList.remove("open");
      document.getElementById("info-popup").classList.remove("open");
      document.querySelector("#info-btn img").src = "/img/info.svg";
      isClicked = false;
      isFilterClicked = false;
      isInfoClicked = false;
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

    document.getElementById("filter-btn").addEventListener("click", () => {
      isFilterClicked = true;
      document.getElementById("filter-drawer").classList.toggle("open");
    });

    // ------------------------------------------------------------
    // Filtering
    // ------------------------------------------------------------

    const navFilter = document.getElementById("nav-filter");
    const clearBtn = document.getElementById("clear-filters");

    function updateLayers() {
      const showParks = document.getElementById("parks").checked;
      const showCentres = document.getElementById("cooling-centres").checked;
      const showAll = !showParks && !showCentres;

      map.setLayoutProperty(
        "parks-fill",
        "visibility",
        showParks || showAll ? "visible" : "none",
      );
      map.setLayoutProperty(
        "parks-outline",
        "visibility",
        showParks || showAll ? "visible" : "none",
      );
      map.setLayoutProperty(
        "cooling-centres-layer",
        "visibility",
        showCentres || showAll ? "visible" : "none",
      );

      clearBtn.classList.toggle("hidden", showAll);
    }

    navFilter.addEventListener("change", updateLayers);

    clearBtn.addEventListener("click", () => {
      document.getElementById("parks").checked = false;
      document.getElementById("cooling-centres").checked = false;
      updateLayers();
    });
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

    // Show drawer on click (resolve map_item_id from DB so crowding / check-in work)
    map.on("click", "parks-fill", async (e) => {
      isClicked = true;
      const props = e.features[0].properties;
      const titleRaw =
        props.park_name != null && String(props.park_name).trim() !== ""
          ? String(props.park_name).trim()
          : props.name != null && String(props.name).trim() !== ""
            ? String(props.name).trim()
            : "Park";
      const parkUrl = props.park_url != null ? String(props.park_url) : "";
      const parkLink =
        parkUrl !== ""
          ? `<a href="${escapeHtml(parkUrl)}" target="_blank" rel="noopener noreferrer" class="underline">Visit website</a>`
          : "";

      let mapItemId = null;
      if (titleRaw !== "") {
        try {
          const r = await fetch(
            `/api/locations/park-by-name?name=${encodeURIComponent(titleRaw)}`,
          );
          if (r.ok) {
            const j = await r.json();
            if (j.map_item_id != null) {
              mapItemId = String(j.map_item_id);
            }
          }
        } catch (lookupErr) {
          console.warn("park map_item lookup:", lookupErr);
        }
      }

      openDrawer(titleRaw, parkLink, mapItemId, titleRaw, "");
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
        .catch(() => ({ centre: c, coords: null })),
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
          hours: r.centre.hours,
          description: r.centre.description,
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
      const context = `Address: ${props.address}, Type: ${props.type}`;
      openDrawer(
        props.name,
        `<ul>
          <li>${escapeHtml(String(props.address))}</li>
          <li>${escapeHtml(String(props.type))}</li>
          <li>${escapeHtml(props.hours != null ? String(props.hours) : "Hours unavailable")}</li>
          <li>${escapeHtml(props.description != null ? String(props.description) : "")}</li>
        </ul>`,
        props.map_item_id,
        props.name,
        context,
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
