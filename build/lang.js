// === 🌐 Dictionnaire des traductions ===
const i18n = {
  fr: {
    titre: "Générateur Catan",
    options: "Options :",
    nombre: "Nombre",
    mer: "Mer",
    colonie: "Colonie",
    route: "Route",
    desert: "Forcer le désert au centre",
    sameRes: "Même ressource peuvent se toucher",
    sameNum: "Même nombre peuvent se toucher",
    sixhuit: "6 et 8 peuvent se toucher",
    deuxdouze: "2 et 12 peuvent se toucher",
    resRule: "2 et 12 peuvent être sur la même ressource",
    portRule: "Ports équilibrés (Pas de ressource forte (6 ou 8) adjacente à son port 2:1)",
    equilibre: "Équilibre global des points de probabilité (7-11 autour de chaque sommet)",
    minRes: "Somme mini par ressource (11 pour bois/blé/mouton, 9 pour argile/minerai)",
    niv1: "Aléatoire",
    niv2: "Moyen",
    niv3: "Strict",
    bouton: "Génération",
    niveau: "Équilibrage",
    ratio: "Ratio"
  },
  en: {
    titre: "Catan Generator",
    options: "Options :",
    nombre: "Number",
    mer: "Sea",
    colonie: "Settlement",
    route: "Road",
    desert: "Force desert at center",
    sameRes: "Same resources can touch",
    sameNum: "Same numbers can touch",
    sixhuit: "6 and 8 can touch",
    deuxdouze: "2 and 12 can touch",
    resRule: "2 and 12 may be on same resource",
    portRule: "Balanced ports (No strong resource (6 or 8) next to its 2:1 port)",
    equilibre: "Global balance of probability points (7-11 around each vertex)",
    minRes: "Minimum sum per resource (11 for wood/wheat/sheep, 9 for clay/ore)",
    niv1: "Random",
    niv2: "Medium",
    niv3: "Strict",
    bouton: "Generate",
    niveau: "Balancing",
    ratio: "Ratio"
  }
};

// === 🧩 Fonction principale de traduction ===
function appliquerTraduction(lang) {
  // ✅ Met à jour la langue dans <html lang="...">
  document.documentElement.lang = lang;

  // ✅ Traduit tous les éléments marqués data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (!key) return;

    const traduction = i18n[lang]?.[key];
    if (!traduction) return;

    // 🔹 Si on doit garder la partie après les deux-points (ex: "Niveau : Medium")
    if (el.dataset.i18nKeepValue === "true" && el.textContent.includes(":")) {
      const [avant, apres] = el.textContent.split(/:(.*)/s); // garde tout après le premier :
      el.textContent = `${traduction}:${apres}`;
    } else {
      el.textContent = traduction;
    }
  });

  // ✅ Met à jour le texte du loader
  const loader = document.getElementById("loading-indicator");
  if (loader) {
    loader.textContent = i18n[lang]?.loading ?? "🌀 Loading...";
  }

  // ✅ Met à jour le sélecteur visuel 🇫🇷 / 🇬🇧
  document.querySelectorAll("#lang-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

// === 🚀 Initialisation automatique au chargement ===
document.addEventListener("DOMContentLoaded", () => {
  // 🌍 Détection de la langue initiale du navigateur
  let currentLang = navigator.language.startsWith("fr") ? "fr" : "en";
  appliquerTraduction(currentLang);

  // 🔁 Gestion du changement de langue par clic
  document.querySelectorAll("#lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      appliquerTraduction(currentLang);
    });
  });

  // 🩹 Rétablit l'état initial du bandeau d'analyse
  document.getElementById("analyse-bar")?.classList.add("hidden");
});



// === 💾 Sauvegarde automatique des préférences ===
document.addEventListener("DOMContentLoaded", () => {
  // --- 1) Restaurer les checkboxes (par id) ---
  const savedPrefs = JSON.parse(localStorage.getItem("prefsCatan") || "{}");
  document.querySelectorAll('input[type="checkbox"][id]').forEach(input => {
    const saved = savedPrefs[input.id];
    if (typeof saved === "boolean") input.checked = saved;
  });

  // --- 2) Restaurer le niveau (radios) ---
  const savedNiveau = localStorage.getItem("niveauCatan");
  if (savedNiveau) {
    const radio = document.querySelector(`input[name="niveauEquilibre"][value="${savedNiveau}"]`);
    if (radio) radio.checked = true;
  }

  // --- 3) Restaurer la langue ---
  const savedLang = localStorage.getItem("langueCatan");
  if (savedLang) {
    document.documentElement.lang = savedLang;
    appliquerTraduction(savedLang);
  }

  // --- 4) Écouter les checkboxes et les sauver (par id) ---
  document.querySelectorAll('input[type="checkbox"][id]').forEach(input => {
    input.addEventListener("change", () => {
      const prefs = JSON.parse(localStorage.getItem("prefsCatan") || "{}");
      prefs[input.id] = input.checked;
      localStorage.setItem("prefsCatan", JSON.stringify(prefs));
    });
  });

  // --- 5) Écouter le groupe de niveau et sauver la valeur choisie ---
  document.querySelectorAll('input[name="niveauEquilibre"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.checked) {
        localStorage.setItem("niveauCatan", e.target.value);
      }
    });
  });

  // --- 6) Sauver la langue quand on clique un drapeau ---
  document.querySelectorAll("#lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      localStorage.setItem("langueCatan", lang);
    });
  });

  document.body.classList.remove("invisible");
});

