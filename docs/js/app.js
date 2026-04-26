const screens = [...document.querySelectorAll("[data-screen]")];
const goButtons = [...document.querySelectorAll("[data-go]")];
const registrationForm = document.querySelector("[data-registration-form]");
const levelingForm = document.querySelector("[data-leveling-form]");
const valuesForm = document.querySelector("[data-values-form]");
const userNameTarget = document.querySelector("[data-user-name]");

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem("karekano-profile")) || {};
  } catch {
    return {};
  }
}

function writeProfile(nextProfile) {
  const currentProfile = readProfile();
  try {
    localStorage.setItem("karekano-profile", JSON.stringify({ ...currentProfile, ...nextProfile }));
  } catch {
    // The splash flow still works without profile persistence.
  }
}

function fillForm(form, profile) {
  Object.entries(profile).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;

    if (field instanceof RadioNodeList) {
      [...field].forEach((radio) => {
        radio.checked = radio.value === value;
      });
      return;
    }

    field.value = value;
  });
}

function updateProfileView() {
  const profile = readProfile();
  if (userNameTarget) {
    userNameTarget.textContent = profile.nickname || "ゲスト";
  }
}

function showScreen(screenName) {
  const nextScreen = screens.find((screen) => screen.dataset.screen === screenName) || screens[0];
  screens.forEach((screen) => {
    const isActive = screen === nextScreen;
    screen.classList.toggle("active", isActive);
    screen.toggleAttribute("hidden", !isActive);
  });

  goButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.go === nextScreen.dataset.screen);
  });

  updateProfileView();
  history.replaceState(null, "", `#${nextScreen.dataset.screen}`);
  nextScreen.scrollIntoView({ block: "start" });
}

function saveForm(form) {
  const data = new FormData(form);
  writeProfile(Object.fromEntries(data.entries()));
}

[registrationForm, levelingForm, valuesForm].forEach((form) => {
  if (form) {
    fillForm(form, readProfile());
  }
});

if (registrationForm) {
  registrationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveForm(registrationForm);
    showScreen("leveling");
  });
}

if (levelingForm) {
  levelingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveForm(levelingForm);
    showScreen("values");
  });
}

if (valuesForm) {
  valuesForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveForm(valuesForm);
    showScreen("stage0");
  });
}

goButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(button.dataset.go);
  });
});

showScreen(location.hash.replace("#", "") || "top");
