import {
  loadLocalStorage,
  saveToLocalStorage,
  getLocalData,
  toggleTheme,
} from "/js/utils.js";

loadLocalStorage();
const _data = getLocalData();
let hasChanges = false;

let saveBtn;
const allowSaving = () => {
  hasChanges = true;
  saveBtn.removeAttribute("disabled");
};
const disableSaving = () => {
  hasChanges = false;
  saveBtn.setAttribute("disabled", "true");
};

// TODO inputs
/* Username */
const username = document.getElementById("username").querySelector("v-input");
username.setValue("TODO put the username here!");
username.addEventListener("change", (e) => {
  console.log(username.getValue());
  e.stopPropagation();
});

/* Password */
const password = document.getElementById("password").querySelector("v-input");
password.setValue("TODO put the password here!");
password.addEventListener("change", (e) => {
  console.log(password.getValue());
  e.stopPropagation();
});

/* Email */
const email = document.getElementById("email").querySelector("v-input");
email.setValue("TODO put the email here!");
email.addEventListener("change", (e) => {
  console.log(email.getValue(), "invalidEmail@example.com");
  e.stopPropagation();
});

/* Theme Toggle */
const themeToggleDiv = document.getElementById("theme");
const themeToggle = themeToggleDiv.children[0];
const updateThemeIcon = () => {
  toggleTheme([["opacity", _data.isDark ? 1 : 0.5]]);

  if (_data.isDark) {
    themeToggleDiv.children[1].style.display = "none";
    themeToggleDiv.children[2].style.display = "";
    themeToggleDiv.children[3].textContent = "Dark Mode";
  } else {
    themeToggleDiv.children[2].style.display = "none";
    themeToggleDiv.children[1].style.display = "";
    themeToggleDiv.children[3].textContent = "Light Mode";
  }
};

if (_data.isDark) themeToggle.value = true;
updateThemeIcon();
themeToggle.addEventListener("click", (e) => {
  _data.isDark = themeToggle.value;
  allowSaving();
  updateThemeIcon();

  e.stopPropagation();
});

// TODO other toggles

/* Save Button */
saveBtn = document.getElementById("save");
saveBtn.addEventListener("click", (e) => {
  if (hasChanges) {
    saveToLocalStorage();
    disableSaving();
  }

  e.stopPropagation();
});
