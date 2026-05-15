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

/**
 * Returns the current position of the center of the map.
 *
 * @returns {lon, lat}
 */
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

/**
 * Returns the value to be sorted by and the order to be sorted by
 *
 * @returns {sort, order}
 */
function getSortParams() {
  const sort = searchSortBy && searchSortBy.value ? searchSortBy.value : "type";
  const order =
    searchSortOrder && searchSortOrder.value ? searchSortOrder.value : "asc";
  return { sort, order };
}

/**
 * Creates and returns the url to be sent to the api to search map items.
 *
 * @param {*} query, String input from the user
 * @returns url to request search results from database
 */
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

/**
 * Toggles the visibility of the search results panel.
 *
 * @param {Boolean} visible current visibility of the search panel
 * @returns null
 */
function setSearchPanelVisible(visible) {
  if (!searchResultsPanel) {
    console.error("No search results panel found");
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

/**
 * Returns true if the search panel is visible.
 *
 * @returns null if no search results panel, true if panel visible
 */
function isSearchPanelOpen() {
  if (!searchResultsPanel) {
    return false;
  }
  if (searchResultsPanel.hasAttribute("hidden")) {
    return false;
  }
  return !searchResultsPanel.classList.contains("hidden");
}

/**
 * Sets search results panel to not be visible and clears its contents.
 */
function closeSearchPanel() {
  if (searchResultsList) {
    searchResultsList.innerHTML = "";
  }
  setSearchPanelVisible(false);
}

/**
 * Returns true if target is within the screen space bounds of the search results panel.
 *
 * @param {PointerEvent.target} target
 * @returns true if within bounds of search results panel
 */
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

/**
 * Adds results of searching for user input to search results and displays them.
 *
 * @returns null if no searchField, searchResultsList or userInput.
 */
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

/**
 * Searches database again when sort preference changes
 *
 * @returns null if no searchField or no user input
 */
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

/**
 * Handles activation of a search result row from a click or keyboard event.
 * Closes the search panel and opens the map item drawer, unless an in-row link was activated.
 *
 * @param {*} row search result row element with data-map-item-id
 * @param {*} e click or keyboard event on the row
 * @returns null if the row has no map item id or an in-row link was activated
 */
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
