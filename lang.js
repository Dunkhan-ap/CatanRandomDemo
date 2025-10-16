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
    ratio: "Ratio",
    fan: "Projet de fans inspiré de Catan®. Non affilié ni approuvé par Catan GmbH ou Catan Studio."
  },
  en: {
    titre: "Catan Generator",
    options: "Options:",
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
    ratio: "Ratio",
    fan: "Fan project inspired by Catan®. Not affiliated with or endorsed by Catan GmbH or Catan Studio."
  },
  de: {
    titre: "Catan-Generator",
    options: "Optionen:",
    nombre: "Zahl",
    mer: "Meer",
    colonie: "Siedlung",
    route: "Straße",
    desert: "Wüste in der Mitte erzwingen",
    sameRes: "Gleiche Ressourcen dürfen sich berühren",
    sameNum: "Gleiche Zahlen dürfen sich berühren",
    sixhuit: "6 und 8 dürfen sich berühren",
    deuxdouze: "2 und 12 dürfen sich berühren",
    resRule: "2 und 12 dürfen auf derselben Ressource liegen",
    portRule: "Ausgeglichene Häfen (Keine starke Ressource (6 oder 8) neben ihrem 2:1-Hafen)",
    equilibre: "Globales Gleichgewicht der Wahrscheinlichkeiten (7-11 um jeden Schnittpunkt)",
    minRes: "Mindestsumme pro Ressource (11 für Holz/Weizen/Schaf, 9 für Lehm/Erz)",
    niv1: "Zufällig",
    niv2: "Mittel",
    niv3: "Strikt",
    bouton: "Generieren",
    niveau: "Ausgleich",
    ratio: "Verhältnis",
    fan: "Fanprojekt, inspiriert von Catan®. Nicht offiziell, nicht verbunden mit oder unterstützt von Catan GmbH oder Catan Studio."
  }
};


// === 🧩 Fonction principale de traduction ===
function appliquerTraduction(lang) {
  document.documentElement.lang = lang;

  // ✅ Traduit les éléments avec data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (!key) return;
    const trad = i18n[lang]?.[key];
    if (!trad) return;

    if (el.dataset.i18nKeepValue === "true" && el.textContent.includes(":")) {
      const [avant, apres] = el.textContent.split(/:(.*)/s);
      el.textContent = `${trad}:${apres}`;
    } else {
      el.textContent = trad;
    }
  });

  // ✅ Loader
  const loader = document.getElementById("loading-indicator");
  if (loader) loader.textContent = i18n[lang]?.loading ?? "🌀 Loading...";

  // ✅ Sélecteur visuel 🇫🇷/🇬🇧/🇩🇪
  document.querySelectorAll("#lang-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  // 🟢 NOUVEAUTÉ : rafraîchit les badges d’analyse si déjà affichés
  const niveauBadge = document.getElementById("niveau-badge");
  const ratioBadge = document.getElementById("ratio-badge");

  if (niveauBadge && !niveauBadge.classList.contains("hidden")) {
    const niv = window.seuilsActuels?.nom ?? 1;
    const libNiv = i18n[lang]?.[`niv${niv}`] ?? i18n.fr?.[`niv${niv}`] ?? niv;
    niveauBadge.textContent = `${i18n[lang]?.niveau ?? "Équilibrage"} : ${libNiv}`;
  }

  if (ratioBadge && !ratioBadge.classList.contains("hidden")) {
    const ratio = window.dernierRatio ?? 1;
    const ratioCap = window.dernierRatioCap ?? 1;
    ratioBadge.textContent = `${i18n[lang]?.ratio ?? "Ratio"} : ${ratio.toFixed(2)} (≤ ${ratioCap.toFixed(2)})`;
  }
}


// === 🚀 Initialisation automatique au chargement ===
document.addEventListener("DOMContentLoaded", () => {
  // 🌍 Détection de la langue initiale
  let currentLang;
  const savedLang = localStorage.getItem("langueCatan");
  if (savedLang) {
    currentLang = savedLang;
  } else {
    const browserLang = navigator.language;
    if (browserLang.startsWith("fr")) currentLang = "fr";
    else if (browserLang.startsWith("de")) currentLang = "de";
    else currentLang = "en";
  }

  appliquerTraduction(currentLang);

  // 🔁 Gestion du changement de langue
  document.querySelectorAll("#lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      localStorage.setItem("langueCatan", currentLang);
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

  // --- 3) Écouter les checkboxes et les sauver ---
  document.querySelectorAll('input[type="checkbox"][id]').forEach(input => {
    input.addEventListener("change", () => {
      const prefs = JSON.parse(localStorage.getItem("prefsCatan") || "{}");
      prefs[input.id] = input.checked;
      localStorage.setItem("prefsCatan", JSON.stringify(prefs));
    });
  });

  // --- 4) Écouter le groupe de niveau ---
  document.querySelectorAll('input[name="niveauEquilibre"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (e.target.checked) {
        localStorage.setItem("niveauCatan", e.target.value);
      }
    });
  });

  document.body.classList.remove("invisible");
});
