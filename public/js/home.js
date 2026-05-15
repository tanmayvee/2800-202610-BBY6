import { loadLocalStorage, getLocalData, toggleTheme } from "/js/utils.js";

loadLocalStorage();

const _data = getLocalData();
toggleTheme([["opacity", _data.isDark ? 1 : 0.5]]);
