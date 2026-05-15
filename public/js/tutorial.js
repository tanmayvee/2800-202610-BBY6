const steps = [
  { title: "Parks", text: "Click the map to explore nearby parks." },
  { title: "UV Index", text: "See real-time UV levels in your area." },
  { title: "Cooling Centres", text: "Find air-conditioned spaces near you." },
  { title: "Done!", text: "You're ready to go!" },
];

let currentSteps = 0;

function cyclePopup() {
  currentSteps++;

  if (currentSteps < steps.length) {
    document.querySelector(".popupHeader").textContent =
      steps[currentSteps].title;
    document.querySelector(".popupText").textContent = steps[currentSteps].text;
  }
  if (currentSteps == steps.length - 1) {
    document.querySelector(".popupbutton").textContent = "Close";
  }
  if (currentSteps == steps.length) {
    document.querySelector(".popupBackground").style.display = "none";
    document.querySelector(".popup").style.display = "none";
  }
}

const btn = document.querySelector(".popupbutton");
if (btn) {
  btn.addEventListener("click", cyclePopup);
}
