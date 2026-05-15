const express = require("express");
const path = require("path");
const ejs = require("ejs");
const router = express.Router();
const supabase = require("../db/supabase");

const searchResultTemplate = path.join(
  __dirname,
  "..",
  "views",
  "templates",
  "search-result.ejs"
);

const DEFAULT_LON = -123.1207;
const DEFAULT_LAT = 49.2827;
const RPC_CONCURRENCY = 10;

/**
 * @param {unknown} data
 * @returns {number}
 */
function crowdingCountFromRpcData(data) {
  let count = 0;
  if (typeof data === "number" && Number.isFinite(data)) {
    count = data;
  } else if (typeof data === "string") {
    const parsed = parseInt(data, 10);
    count = Number.isNaN(parsed) ? 0 : parsed;
  } else if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    count =
      typeof first === "number"
        ? first
        : typeof first === "object" && first != null
          ? Number(Object.values(first)[0]) || 0
          : 0;
  } else if (data != null) {
    const n = Number(data);
    count = Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  return count;
}

/**
 * @param {object} row
 * @param {"cooling" | "park"} kind
 */
function rowToTemplateLocals(row, kind) {
  const mapItemId = row.map_item_id ?? row.id;
  const name =
    row.name ??
    row.park_name ??
    row.item_name ??
    "Unknown";
  const itemType =
    kind === "cooling"
      ? row.type || "Cooling centre"
      : "Park";
  return {
    map_item_id: mapItemId != null ? String(mapItemId) : "",
    item_name: name,
    item_type: itemType,
    item_link: `/location/${mapItemId}`,
  };
}

function renderSearchResultHtml(locals) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(searchResultTemplate, locals, (err, html) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(html);
    });
  });
}

/**
 * @param {number[]} ids
 * @param {number} batchSize
 * @param {(id: number) => Promise<void>} fn
 */
async function runBatched(ids, batchSize, fn) {
  for (let i = 0; i < ids.length; i += batchSize) {
    const slice = ids.slice(i, i + batchSize);
    await Promise.all(slice.map((id) => fn(id)));
  }
}

/**
 * @param {{ locals: object, distance_m: number | null, crowding: number }} a
 * @param {{ locals: object, distance_m: number | null, crowding: number }} b
 */
function compareByName(a, b) {
  const na = String(a.locals.item_name || "");
  const nb = String(b.locals.item_name || "");
  return na.localeCompare(nb, undefined, { sensitivity: "base" });
}

/**
 * @param {{ locals: object, distance_m: number | null, crowding: number }} a
 * @param {{ locals: object, distance_m: number | null, crowding: number }} b
 * @param {boolean} asc
 */
function compareDistance(a, b, asc) {
  const aNull = a.distance_m == null || !Number.isFinite(a.distance_m);
  const bNull = b.distance_m == null || !Number.isFinite(b.distance_m);
  if (aNull && bNull) {
    return compareByName(a, b);
  }
  if (aNull) {
    return asc ? 1 : -1;
  }
  if (bNull) {
    return asc ? -1 : 1;
  }
  const da = a.distance_m;
  const db = b.distance_m;
  if (da === db) {
    return compareByName(a, b);
  }
  if (asc) {
    return da < db ? -1 : 1;
  }
  return da > db ? -1 : 1;
}

/**
 * @param {{ locals: object, distance_m: number | null, crowding: number }} a
 * @param {{ locals: object, distance_m: number | null, crowding: number }} b
 * @param {boolean} asc
 */
function compareCrowding(a, b, asc) {
  const ca = a.crowding;
  const cb = b.crowding;
  if (ca === cb) {
    return compareByName(a, b);
  }
  if (asc) {
    return ca < cb ? -1 : 1;
  }
  return ca > cb ? -1 : 1;
}

/**
 * @param {{ locals: object, distance_m: number | null, crowding: number }} a
 * @param {{ locals: object, distance_m: number | null, crowding: number }} b
 * @param {boolean} asc
 */
function compareType(a, b, asc) {
  const ta = String(a.locals.item_type || "");
  const tb = String(b.locals.item_type || "");
  const tCmp = asc ? ta.localeCompare(tb, undefined, { sensitivity: "base" }) : tb.localeCompare(ta, undefined, { sensitivity: "base" });
  if (tCmp !== 0) {
    return tCmp;
  }
  return compareByName(a, b);
}

// GET /api/search/map?q=...&sort=&order=&lon=&lat=
// Runs get_cooling_center_search and get_park_search; enriches with distance/crowding; sorts; returns HTML list items.
router.get("/map", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!q) {
      return res.json({ html: "" });
    }

    const sortRaw = typeof req.query.sort === "string" ? req.query.sort.trim() : "type";
    const sort = sortRaw === "distance" || sortRaw === "crowding" || sortRaw === "type" ? sortRaw : "type";

    const orderRaw = typeof req.query.order === "string" ? req.query.order.trim().toLowerCase() : "asc";
    const asc = orderRaw !== "desc";

    const lonRaw = req.query.lon;
    const latRaw = req.query.lat;
    let lon = DEFAULT_LON;
    let lat = DEFAULT_LAT;
    if (lonRaw !== undefined && lonRaw !== null && String(lonRaw).trim() !== "") {
      const parsed = parseFloat(String(lonRaw));
      if (Number.isFinite(parsed)) {
        lon = parsed;
      }
    }
    if (latRaw !== undefined && latRaw !== null && String(latRaw).trim() !== "") {
      const parsed = parseFloat(String(latRaw));
      if (Number.isFinite(parsed)) {
        lat = parsed;
      }
    }

    const [{ data: coolingRows, error: coolingError }, { data: parkRows, error: parkError }] =
      await Promise.all([
        supabase.rpc("get_cooling_center_search", { search: q }),
        supabase.rpc("get_park_search", { search: q }),
      ]);

    if (coolingError) {
      console.error("get_cooling_center_search:", coolingError.message);
      throw coolingError;
    }
    if (parkError) {
      console.error("get_park_search:", parkError.message);
      throw parkError;
    }

    const cooling = Array.isArray(coolingRows) ? coolingRows : [];
    const parks = Array.isArray(parkRows) ? parkRows : [];

    const localsList = [
      ...cooling.map((row) => rowToTemplateLocals(row, "cooling")),
      ...parks.map((row) => rowToTemplateLocals(row, "park")),
    ];

    /** @type {{ locals: object, distance_m: number | null, crowding: number }[]} */
    const enriched = localsList.map((locals) => ({
      locals,
      distance_m: null,
      crowding: 0,
    }));

    const idNums = [
      ...new Set(
        enriched
          .map((row) => parseInt(String(row.locals.map_item_id), 10))
          .filter((n) => !Number.isNaN(n))
      ),
    ];

    const distById = {};
    await runBatched(idNums, RPC_CONCURRENCY, async (mapItemId) => {
      const { data, error } = await supabase.rpc("get_distance_to_map_item", {
        point_long: lon,
        point_lat: lat,
        p_map_item_id: mapItemId,
      });
      if (error) {
        console.error("get_distance_to_map_item:", mapItemId, error.message);
        distById[mapItemId] = null;
        return;
      }
      let meters = null;
      if (typeof data === "number" && Number.isFinite(data)) {
        meters = data;
      } else if (data != null) {
        const n = Number(data);
        meters = Number.isFinite(n) ? n : null;
      }
      distById[mapItemId] = meters;
    });

    const crowdById = {};
    await runBatched(idNums, RPC_CONCURRENCY, async (mapItemId) => {
      const { data, error } = await supabase.rpc("get_location_crowding", {
        target_map_item_id: mapItemId,
      });
      if (error) {
        console.error("get_location_crowding:", mapItemId, error.message);
        crowdById[mapItemId] = 0;
        return;
      }
      crowdById[mapItemId] = crowdingCountFromRpcData(data);
    });

    for (const row of enriched) {
      const idNum = parseInt(String(row.locals.map_item_id), 10);
      if (!Number.isNaN(idNum)) {
        const d = distById[idNum];
        row.distance_m = d === undefined ? null : d;
        row.crowding = crowdById[idNum] ?? 0;
      }
    }

    enriched.sort((a, b) => {
      if (sort === "distance") {
        return compareDistance(a, b, asc);
      }
      if (sort === "crowding") {
        return compareCrowding(a, b, asc);
      }
      return compareType(a, b, asc);
    });

    const fragments = await Promise.all(
      enriched.map((row) => renderSearchResultHtml(row.locals))
    );

    res.json({ html: fragments.join("") });
  } catch (error) {
    console.error("Error in map search:", error.message);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
