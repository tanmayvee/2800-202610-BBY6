const COOLSPOT_DEFAULT_LNG = -123.1207;
const COOLSPOT_DEFAULT_LAT = 49.2827;

const searchField = document.getElementById("map-search");
const searchButton = document.getElementById("map-search-button");
const mapSearchUi = document.getElementById("map-search-ui");
const mapSearchBar = document.getElementById("map-search-bar");
const searchSortBy = document.getElementById("search-sort-by");
const searchSortOrder = document.getElementById("search-sort-order");
const searchResultsPanel = document.getElementById("search-results-panel");
const searchResultsList = document.getElementById("search-results-list");

function getSearchLonLat() {
  const map = window.appMap;
  if (map && typeof map.getCenter === "function") {
    const c = map.getCenter();
    if (c && Number.isFinite(c.lng) && Number.isFinite(c.lat)) {
      return { lon: c.lng, lat: c.lat };
    }
  }
  return { lon: COOLSPOT_DEFAULT_LNG, lat: COOLSPOT_DEFAULT_LAT };
}

function getSortParams() {
  const sort =
    searchSortBy && searchSortBy.value
      ? searchSortBy.value
      : "type";
  const order =
    searchSortOrder && searchSortOrder.value
      ? searchSortOrder.value
      : "asc";
  return { sort, order };
}

function buildSearchMapUrl(query) {
  const params = new URLSearchParams();
  params.set("q", query);
  const { sort, order } = getSortParams();
  params.set("sort", sort);
  params.set("order", order);
  const { lon, lat } = getSearchLonLat();
  params.set("lon", String(lon));
  params.set("lat", String(lat));
  return `/api/search/map?${params.toString()}`;
}

function setSearchPanelVisible(visible) {
  if (!searchResultsPanel) {
    return;
  }
  if (visible) {
    searchResultsPanel.classList.remove("hidden");
    searchResultsPanel.removeAttribute("hidden");
    searchResultsPanel.setAttribute("aria-hidden", "false");
  } else {
    searchResultsPanel.classList.add("hidden");
    searchResultsPanel.setAttribute("hidden", "");
    searchResultsPanel.setAttribute("aria-hidden", "true");
  }
}

function isSearchPanelOpen() {
  if (!searchResultsPanel) {
    return false;
  }
  if (searchResultsPanel.hasAttribute("hidden")) {
    return false;
  }
  return !searchResultsPanel.classList.contains("hidden");
}

function closeSearchPanel() {
  if (searchResultsList) {
    searchResultsList.innerHTML = "";
  }
  setSearchPanelVisible(false);
}

function isClickInsideSearchUi(target) {
  if (!target || !(target instanceof Node)) {
    return false;
  }
  if (mapSearchUi && mapSearchUi.contains(target)) {
    return true;
  }
  if (searchResultsPanel && searchResultsPanel.contains(target)) {
    return true;
  }
  if (mapSearchBar && mapSearchBar.contains(target)) {
    return true;
  }
  return false;
}

async function searchMap() {
  if (!searchField || !searchResultsList) {
    return;
  }

  const userInput = searchField.value.trim();

  if (!userInput) {
    closeSearchPanel();
    return;
  }

  try {
    const url = buildSearchMapUrl(userInput);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    const data = await response.json();
    const html = typeof data.html === "string" ? data.html : "";

    if (html.length === 0) {
      searchResultsList.innerHTML =
        '<li class="list-none border-b-0 py-3 px-1 text-sm text-gray-600">No results found.</li>';
    } else {
      searchResultsList.innerHTML = html;
    }

    setSearchPanelVisible(true);
  } catch (err) {
    console.error(err);
    searchResultsList.innerHTML =
      '<li class="list-none border-b-0 py-3 px-1 text-sm text-red-600">Search could not be completed. Try again.</li>';
    setSearchPanelVisible(true);
  }
}

if (searchButton) {
  searchButton.addEventListener("click", () => {
    searchMap();
  });
}

if (searchField) {
  searchField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchMap();
    }
  });
}

function onSortControlChange() {
  if (!searchField) {
    return;
  }
  if (searchField.value.trim() === "") {
    return;
  }
  searchMap();
}

if (searchSortBy) {
  searchSortBy.addEventListener("change", onSortControlChange);
}

if (searchSortOrder) {
  searchSortOrder.addEventListener("change", onSortControlChange);
}

document.addEventListener("click", (e) => {
  if (!isSearchPanelOpen()) {
    return;
  }
  if (isClickInsideSearchUi(e.target)) {
    return;
  }
  closeSearchPanel();
});

async function activateSearchResultRow(row, e) {
  const id = row.getAttribute("data-map-item-id");
  if (!id) {
    return;
  }
  const link = e.target.closest("a[href]");
  if (link && row.contains(link)) {
    setTimeout(() => closeSearchPanel(), 0);
    return;
  }
  e.stopPropagation();

  closeSearchPanel();

  if (typeof window.openDrawerForMapItem === "function") {
    await window.openDrawerForMapItem(id);
  }
}

if (searchResultsList) {
  searchResultsList.addEventListener("click", (e) => {
    const row = e.target.closest("[data-map-item-id]");
    if (!row || !searchResultsList.contains(row)) {
      return;
    }
    activateSearchResultRow(row, e);
  });

  searchResultsList.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") {
      return;
    }
    if (e.target.closest("a[href]")) {
      return;
    }
    const row = e.target.closest("[data-map-item-id]");
    if (!row || !searchResultsList.contains(row)) {
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
    }
    activateSearchResultRow(row, e);
  });
}
