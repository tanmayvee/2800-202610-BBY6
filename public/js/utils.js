let _localStoreData = {};

const saveToLocalStorage = function () {
  localStorage.setItem("CoolSpotData", JSON.stringify(_localStoreData));
};

const loadLocalStorage = function () {
  try {
    _localStoreData = JSON.parse(localStorage.getItem("CoolSpotData")) ?? {};
  } catch {
    console.warn("Malformed local storage data!");
    _localStoreData = {};
  }
};

const getLocalData = function () {
  // Objects in JS are mutable, scripts can edit keys in the object
  // itself and the changes will show here
  return _localStoreData;
};

const toggleTheme = function (opt_extraStyles) {
  const bodyStyle = document.body.style;
  if (_localStoreData.isDark) {
    bodyStyle.setProperty("--theme", "#000");
    bodyStyle.setProperty("--theme-filter", "invert(1)");
    bodyStyle.setProperty("--theme-text", "#fff");
    bodyStyle.setProperty("--theme-light", "#1f1f1f");
    bodyStyle.setProperty("--theme-text-dark", "#dadada");
  } else {
    bodyStyle.setProperty("--theme", "#fff");
    bodyStyle.setProperty("--theme-filter", "invert(0)");
    bodyStyle.setProperty("--theme-text", "#000");
    bodyStyle.setProperty("--theme-light", "#f4feff");
    bodyStyle.setProperty("--theme-text-dark", "darkslategray");
  }

  if (Array.isArray(opt_extraStyles)) {
    for (const [name, value] of opt_extraStyles) {
      bodyStyle.setProperty("--" + name, value);
    }
  }
};

// prettier-ignore
export {
  saveToLocalStorage,
  loadLocalStorage,
  getLocalData,
  toggleTheme
};
