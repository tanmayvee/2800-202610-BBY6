const currentLocationButton = document.getElementById(
  "current-location-button",
);

const LOGIN_LABEL = "Login to see location crowding";
const LOGGED_IN_LABEL = "Go Here";

/**
 * Reads a Supabase access token if the app (or Supabase JS) stored one in localStorage.
 * Login flow can set localStorage.setItem("coolspot_access_token", session.access_token).
 * Otherwise keys like sb-<project-ref>-auth-token (JSON with access_token) are detected.
 * @returns {string|null}
 */
function getAccessToken() {
  const explicit = localStorage.getItem("coolspot_access_token");
  if (explicit) {
    return explicit;
  }
  let i;
  let key;
  for (i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);
    if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        if (parsed && parsed.access_token) {
          return parsed.access_token;
        }
      } catch (_err) {
        /* ignore */
      }
    }
  }
  return null;
}

function syncButtonLabel() {
  if (!currentLocationButton) {
    return;
  }
  if (getAccessToken()) {
    currentLocationButton.textContent = LOGGED_IN_LABEL;
  } else {
    currentLocationButton.textContent = LOGIN_LABEL;
  }
}

function initCurrentLocationButton() {
  if (!currentLocationButton) {
    return;
  }

  syncButtonLabel();
  window.addEventListener("storage", syncButtonLabel);
  window.addEventListener("focus", syncButtonLabel);

  currentLocationButton.addEventListener("click", async () => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const mapItemId = window.currentOpenMapItemId;
    if (!mapItemId) {
      window.alert(
        "This location is not linked to a map item in the app. Open a cooling centre or pick a location from search.",
      );
      return;
    }

    try {
      const res = await fetch("/api/current-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ map_item_id: mapItemId }),
      });

      if (res.status === 401) {
        localStorage.removeItem("coolspot_access_token");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }

      if (typeof window.refreshDrawerCrowding === "function") {
        window.refreshDrawerCrowding(mapItemId);
      }
    } catch (err) {
      console.error("current-location:", err);
      window.alert(err.message || "Could not save your location.");
    }
  });
}

initCurrentLocationButton();
