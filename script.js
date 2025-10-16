window.addEventListener("load", () => {
  document.body.classList.remove("invisible");
});


/********************
 * PARAMÈTRES DE BASE
 ********************/
let firstScan = true; // ✅ indique si c'est le premier scan

const STRUCTURE = [3, 4, 5, 4, 3];

const MIN_PIPS_PER_RESOURCE = {
  bois: 11,
  ble: 11,
  mouton: 11,
  argile: 9,
  minerai: 9,
};

const RESSOURCES_POOL = [
  "bois", "bois", "bois", "bois",
  "argile", "argile", "argile",
  "mouton", "mouton", "mouton", "mouton",
  "ble", "ble", "ble", "ble",
  "minerai", "minerai", "minerai",
  "desert"
];

const NUMEROS_POOL = [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12];

const PROB_POINTS = {
  2: 1, 12: 1,
  3: 2, 11: 2,
  4: 3, 10: 3,
  5: 4, 9: 4,
  6: 5, 8: 5
};

/********************
 * ADJACENCES HEX & VERTEX
 ********************/
const VERTEX_ADJ = {
  1:[4,5],2:[5,6],3:[6,7],
  4:[1,8],5:[1,2,9],6:[2,3,10],7:[3,11],
  8:[4,12,13],9:[5,13,14],10:[6,14,15],11:[7,15,16],
  12:[8,17],13:[8,9,18],14:[9,10,19],15:[10,11,20],16:[11,21],
  17:[12,22,23],18:[13,23,24],19:[14,24,25],20:[15,25,26],21:[16,26,27],
  22:[17,28],23:[17,18,29],24:[18,19,30],25:[19,20,31],26:[20,21,32],27:[21,33],
  28:[22,34],29:[23,34,35],30:[24,35,36],31:[25,36,37],32:[26,37,38],33:[27,38],
  34:[28,29,39],35:[29,30,40],36:[30,31,41],37:[31,32,42],38:[32,33,43],
  39:[34,44],40:[35,44,45],41:[36,45,46],42:[37,46,47],43:[38,47],
  44:[39,40,48],45:[40,41,49],46:[41,42,50],47:[42,43,51],
  48:[44,52],49:[45,52,53],50:[46,53,54],51:[47,54],
  52:[48,49],53:[49,50],54:[50,51]
};

const VERTEX_TO_HEX = {
  1:[0],2:[1],3:[2],4:[0],5:[0,1],6:[1,2],7:[2],
  8:[0,3],9:[0,1,4],10:[1,2,5],11:[2,6],12:[3],
  13:[0,3,4],14:[1,4,5],15:[2,5,6],16:[6],
  17:[3,7],18:[3,4,8],19:[4,5,9],20:[5,6,10],21:[6,11],
  22:[7],23:[3,7,8],24:[4,8,9],25:[5,9,10],26:[6,10,11],27:[11],
  28:[7],29:[7,8,12],30:[8,9,13],31:[9,10,14],32:[10,11,15],33:[11],
  34:[7,12],35:[8,12,13],36:[9,13,14],37:[10,14,15],38:[11,15],
  39:[12],40:[12,13,16],41:[13,14,17],42:[14,15,18],43:[15],
  44:[12,16],45:[13,16,17],46:[14,17,18],47:[15,18],
  48:[16],49:[16,17],50:[17,18],51:[18],
  52:[16],53:[17],54:[18]
};

const EDGES = {
  top:[6,2,5,1,4],
  topLeft:[8,12,17,22,28],
  bottomLeft:[34,39,44,48,52],
  bottom:[49,53,50,54,51],
  bottomRight:[47,43,38,33,27],
  topRight:[21,16,11,7,3]
};

const BORDS = {
  b21:["mouton","mouton",null,"3p1","3p1"],
  b16:[null,"3p1","3p1",null,null],
  b65:["argile","argile",null,"3p1","3p1"],
  b54:[null,"bois","bois",null,null],
  b43:["ble","ble",null,"3p1","3p1"],
  b32:[null,"minerai","minerai",null,null]
};

const bordToEdge = {
  0:"top",
  1:"topRight",
  2:"bottomRight",
  3:"bottom",
  4:"bottomLeft",
  5:"topLeft"
};

let vertexData = {};

// 🧱 Base de données globale
const routesExistantes = new Set();
const routesCouleurs = {}; // { "12-14": "rouge", "15-20": "bleu", ... }
window.routesExistantes = routesExistantes;


/********************
 * HELPERS GÉNÉRIQUES
 ********************/

// Mélange Fisher–Yates
function shuffle(array) {
  let i = array.length, r;
  while (i !== 0) {
    r = Math.floor(Math.random() * i);
    i--;
    [array[i], array[r]] = [array[r], array[i]];
  }
  return array;
}

/********************
 * CALCUL DE DISTANCE ENTRE SOMMETS (BFS)
 ********************/
function getDistanceEntreSommets(a, b, maxDepth = 10) {
  if (a === b) return 0;
  const visited = new Set([a]);
  let frontier = [a];
  let depth = 0;

  while (frontier.length && depth < maxDepth) {
    depth++;
    const next = [];
    for (const node of frontier) {
      for (const adj of (VERTEX_ADJ[node] || [])) {
        if (adj === b) return depth;
        if (!visited.has(adj)) {
          visited.add(adj);
          next.push(adj);
        }
      }
    }
    frontier = next;
  }
  return Infinity;
}

/**
 * Ajoute une route avec couleur.
 */
function ajouterRoute(a, b, couleur = "rouge") {
  const cle = [Math.min(a, b), Math.max(a, b)].join("-");
  routesExistantes.add(cle);
  routesCouleurs[cle] = couleur.toLowerCase();
}

/**
 * Vérifie l’existence d’une route.
 */
function routeExiste(a, b) {
  const cle = [Math.min(a, b), Math.max(a, b)].join("-");
  return routesExistantes.has(cle);
}

/**
 * Retourne la couleur de la route (ou null).
 */
function routeCouleur(a, b) {
  const cle = [Math.min(a, b), Math.max(a, b)].join("-");
  return routesCouleurs[cle] ?? null;
}

/********************
 * ROUTES DISPONIBLES AUTOUR D’UN SOMMET
 ********************/
/**
 * Renvoie la liste des sommets adjacents à `id`
 * pour lesquels aucune route n’existe encore.
 */
function voisinsSansRoute(id) {
  const adjacents = VERTEX_ADJ[id] || [];
  const libres = adjacents.filter(v => !routeExiste(id, v));

  console.groupCollapsed(`🚧 Sommets adjacents libres depuis ${id}`);
  console.log("→ Adj:", adjacents);
  console.log("→ Libres:", libres);
  console.groupEnd();

  return libres;
}

/********************
 * Vérifie s’il existe déjà une route entre deux sommets
 ********************/
function routeExisteEntre(a, b) {
  const toutesLesRoutes = Array.from(document.querySelectorAll(".route"));
  return toutesLesRoutes.some(r => {
    const v1 = Number(r.dataset.pion);
    const v2 = Number(r.dataset.voisin);
    return (v1 === a && v2 === b) || (v1 === b && v2 === a);
  });
}

/********************
 * 🧩 Affiche une route décorative reliant un pion à un de ses sommets adjacents
 * - couleur : "rouge", "bleu", "orange", "beige"
 ********************/
function poserUneRouteDepuisPion(pionId) {
  
  const routesLayer = document.getElementById("routes-layer");
  if (!routesLayer) return;

  const pionEl = document.querySelector(`.pos${pionId}`);
  if (!pionEl) return;

  // 🔒 Empêche de créer plusieurs routes depuis le même pion
  if (pionEl.dataset.routeCree === "true") return;
  pionEl.dataset.routeCree = "true";

  // 🎨 Couleur du pion
  const couleur = pionEl.dataset.couleur?.toLowerCase() || "rouge";

  // 🔗 Sommets voisins
  const voisins = VERTEX_ADJ[pionId];
  if (!voisins || voisins.length === 0) return;

  // 👉 Choisit un voisin aléatoire
  const voisin = voisins[Math.floor(Math.random() * voisins.length)];

  // 📍 Coordonnées des deux sommets
  const A = getSommetCenterPercent(pionId);
  const B = getSommetCenterPercent(voisin);
  if (!A || !B) return;

  // 🎯 Calcul du centre et de l’angle réel
  const x = (A.x + B.x) / 2;
  const y = (A.y + B.y) / 2;
  let angle = Math.atan2(B.y - A.y, B.x - A.x) * 180 / Math.PI;

  // 🔒 Liste des angles fixes (plateau hexagonal)
  const ANGLES_FIXES = [0, 30, 90, 150, 180, -30, -90, -150];

  // 🧮 Trouver l’angle fixe le plus proche
  const angleFixe = ANGLES_FIXES.reduce((best, curr) =>
    Math.abs(curr - angle) < Math.abs(best - angle) ? curr : best
  );

  // 🎚 Ajustements visuels selon la direction
  let adjustX = 0;
  let adjustY = 0;
  let scaleX = 1;

  switch (angleFixe) {
    case -90:
    case 90:
      scaleX = 1.05;
      break;
    case 30:
      adjustY = +4;
      adjustX = +2;
      break;
    case 150:
      adjustY = +4;
      adjustX = -2;
      break;
    // les autres directions sont déjà correctes
  }

  // 🧱 Création visuelle
  const routeDiv = document.createElement("div");
  routeDiv.classList.add("route", `rou-${couleur}`);
  routeDiv.style.left = `${x}%`;
  routeDiv.style.top = `${y}%`;
  routeDiv.style.transform = `
    translate(calc(-50% + ${adjustX}%), calc(-50% + ${adjustY}%))
    rotate(${angleFixe}deg)
    scaleX(${scaleX})
  `;
  routeDiv.style.zIndex = "60";

  // 💾 Métadonnées
  routeDiv.dataset.pion = pionId;
  routeDiv.dataset.voisin = voisin;
  routeDiv.dataset.couleur = couleur;
  routeDiv.dataset.angleReel = angle.toFixed(2);
  routeDiv.dataset.angleFixe = angleFixe;
  routeDiv.dataset.scaleX = scaleX;

  routesLayer.appendChild(routeDiv);

  // 💾 Enregistrement logique (nouvelle version)
  ajouterRoute(pionId, voisin, couleur);
}

/********************
 * CONSTRUCTION DES ADJACENCES HEXAGONALES EXACTES
 ********************/
function buildHexAdjacency(rowLens) {
  const starts = [];
  let acc = 0;
  for (let r = 0; r < rowLens.length; r++) {
    starts[r] = acc;
    acc += rowLens[r];
  }

  const adj = Array.from({ length: acc }, () => new Set());

  for (let r = 0; r < rowLens.length; r++) {
    const n = rowLens[r];
    for (let c = 0; c < n; c++) {
      const idx = starts[r] + c;

      // voisins gauche / droite
      if (c - 1 >= 0) adj[idx].add(idx - 1);
      if (c + 1 < n) adj[idx].add(idx + 1);

      // voisins haut / bas
      if (r > 0) {
        const nUp = rowLens[r - 1], baseUp = starts[r - 1];
        if (nUp === n - 1) {
          if (c - 1 >= 0) adj[idx].add(baseUp + (c - 1));
          if (c < nUp) adj[idx].add(baseUp + c);
        } else if (nUp === n + 1) {
          adj[idx].add(baseUp + c);
          adj[idx].add(baseUp + c + 1);
        }
      }

      if (r < rowLens.length - 1) {
        const nDn = rowLens[r + 1], baseDn = starts[r + 1];
        if (nDn === n - 1) {
          if (c - 1 >= 0) adj[idx].add(baseDn + (c - 1));
          if (c < nDn) adj[idx].add(baseDn + c);
        } else if (nDn === n + 1) {
          adj[idx].add(baseDn + c);
          adj[idx].add(baseDn + c + 1);
        }
      }
    }
  }

  return adj.map(s => Array.from(s));
}


/********************
 * PLACEMENT DES RESSOURCES AVEC CONTRAINTES
 * - évite les ressources identiques adjacentes si allowRes = false
 * - supporte un mapping fixe (ex: {9: "desert"} pour désert au centre)
 ********************/
function placeResourcesWithConstraints(structure, ressources, tileAdj, allowRes, fixedMap = {}) {
  const total = structure.reduce((s, n) => s + n, 0);
  const pool = [...ressources];
  const placed = Array(total).fill(null);

  // Pré-remplit les cases imposées (ex: désert au centre)
  for (const [idxStr, res] of Object.entries(fixedMap)) {
    const idx = Number(idxStr);
    placed[idx] = res;
    const pos = pool.indexOf(res);
    if (pos !== -1) pool.splice(pos, 1);
  }

  function backtrack(index, pool, placed) {
    if (index === total) return placed;

    // si déjà imposé, passer au suivant
    if (placed[index] !== null) {
      return backtrack(index + 1, pool, placed);
    }

    const candidates = shuffle([...new Set(pool)]);
    for (const res of candidates) {
      if (!pool.includes(res)) continue;

      // Interdit 2 mêmes ressources voisines si allowRes = false
      if (!allowRes && res !== "desert") {
        if (tileAdj[index].some(v => placed[v] === res)) continue;
      }

      const newPlaced = placed.slice();
      newPlaced[index] = res;

      const newPool = pool.slice();
      newPool.splice(newPool.indexOf(res), 1);

      const result = backtrack(index + 1, newPool, newPlaced);
      if (result) return result;
    }

    return null;
  }

  return backtrack(0, pool, placed);
}

/********************
 * ATTRIBUTION DES NUMÉROS (JETONS) AVEC CONTRAINTES
 *
 * Params :
 *  - allow68 : autoriser 6/8 adjacents
 *  - allow212 : autoriser 2/12 adjacents
 *  - allowRes : autoriser même ressource adjacente
 *  - allowRessourceRule :
 *      ✔️ coché → autoriser plusieurs 2/12 sur un même type de ressource
 *      ✖️ décoché → interdire >1 (2/12) par type de ressource
 *  - allowSameNumber : autoriser même numéro adjacent
 ********************/
function assignNumbersWithConstraints(
  resourcesByIndex,
  numeros,
  tileAdj,
  allow68,
  allow212,
  allowRes,
  allowRessourceRule,
  allowSameNumber
) {
  const slots = [];
  for (let i = 0; i < resourcesByIndex.length; i++) {
    if (resourcesByIndex[i] !== "desert") slots.push(i);
  }

  let tries = 0;
  const maxTries = 6000;

  while (tries < maxTries) {
    const shuffled = shuffle([...numeros]);
    const nums = new Array(resourcesByIndex.length).fill(null);

    for (let k = 0; k < slots.length; k++) nums[slots[k]] = shuffled[k];

    if (isValidLayout(
      nums,
      tileAdj,
      allow68,
      allow212,
      resourcesByIndex,
      allowRessourceRule,
      allowSameNumber
    )) {
      return nums;
    }

    tries++;
  }

  console.warn("⚠️ Aucune attribution parfaite, fallback aléatoire");
  const nums = new Array(resourcesByIndex.length).fill(null);
  const shuffled = shuffle([...numeros]);
  for (let k = 0; k < slots.length; k++) nums[slots[k]] = shuffled[k];
  return nums;
}

/********************
 * VALIDATION DES CONTRAINTES DE VOISINAGE
 *
 * - 6/8 adjacents (optionnel)
 * - 2/12 adjacents (optionnel)
 * - même numéro adjacent (optionnel)
 * - règle “2 et 12 sur la même ressource” (optionnel)
 ********************/
function isValidLayout(
  numsByIndex,
  tileAdj,
  allow68,
  allow212,
  resourcesByIndex,
  allowRessourceRule,
  allowSameNumber
) {
  const isBad = (x) => x === 2 || x === 12;

  // Vérifie les contraintes entre tuiles voisines
  for (let i = 0; i < numsByIndex.length; i++) {
    const n = numsByIndex[i];
    for (const j of tileAdj[i]) {
      const m = numsByIndex[j];

      // Interdiction 6/8 voisins
      if (!allow68) {
        if ((n === 6 && (m === 6 || m === 8)) || (n === 8 && (m === 6 || m === 8))) {
          return false;
        }
      }

      // Interdiction 2/12 voisins
      if (!allow212) {
        if ((n === 2 && (m === 2 || m === 12)) || (n === 12 && (m === 2 || m === 12))) {
          return false;
        }
      }

      // Interdiction même numéro adjacent
      if (!allowSameNumber) {
        if (n != null && n === m) {
          return false;
        }
      }
    }
  }

  // Règle “2 et 12 sur la même ressource”
  if (!allowRessourceRule) {
    const badCountByResource = Object.create(null);
    for (let i = 0; i < numsByIndex.length; i++) {
      const res = resourcesByIndex[i];
      if (!res || res === "desert") continue;
      if (isBad(numsByIndex[i])) {
        badCountByResource[res] = (badCountByResource[res] || 0) + 1;
        if (badCountByResource[res] > 1) {
          return false;
        }
      }
    }
  }

  return true;
}

/********************
 * CHECK ÉQUILIBRE PROBABILISTE (SOMMETS)
 ********************/
function checkEquilibreGlobalSommets(
  resourcesByIndex,
  numbersByIndex,
  { log = true, min = 7, max = 11 } = {}
) {
  let ok = true;
  let totalScore = 0, totalSommets = 0;

  for (let v = 1; v <= 54; v++) {
    const hexAdj = VERTEX_TO_HEX[v] || [];
    if (hexAdj.length < 3) continue; // ignore sommets de bord

    let score = 0;
    for (const hIdx of hexAdj) {
      const res = resourcesByIndex[hIdx];
      if (res === "desert") continue; // ignore désert
      const num = numbersByIndex[hIdx];
      if (num && PROB_POINTS[num]) score += PROB_POINTS[num];
    }

    totalScore += score;
    totalSommets++;

    if (score < min || score > max) {
      ok = false;
    }
  }

  if (log) {
    const moyenne = (totalScore / Math.max(totalSommets, 1)).toFixed(1);
    console.log(`⚖️ Moyenne des sommets internes : ${moyenne} pts`);
    if (ok)
      console.warn(`✅ Équilibre global respecté (chaque sommet entre ${min} et ${max} pts)`);
  }

  return ok;
}

/********************
 * ENFORCE ÉQUILIBRE PROBABILISTE
 ********************/
function enforceEquilibreSommets(resourcesByIndex, numbersByIndex, tileAdj, opts = {}, maxTries = 200) {
  let tries = 0;

  while (!checkEquilibreGlobalSommets(resourcesByIndex, numbersByIndex, { log: false, ...opts }) && tries < maxTries) {
    numbersByIndex = assignNumbersWithConstraints(
      resourcesByIndex,
      NUMEROS_POOL,
      tileAdj,
      document.getElementById("sixhuit").checked,
      document.getElementById("deuxdouze").checked,
      document.getElementById("sameResRule").checked,
      document.getElementById("ressourceRule").checked,
      document.getElementById("sameNumberRule").checked
    );
    tries++;
  }

  const ok = checkEquilibreGlobalSommets(resourcesByIndex, numbersByIndex, { log: true, ...opts });
  return { ok, numbersByIndex };
}

/********************
 * PIPS PAR TYPE DE RESSOURCE
 ********************/
function computePipsPerResource(resourcesByIndex, numbersByIndex) {
  const sums = { bois: 0, mouton: 0, ble: 0, argile: 0, minerai: 0 };

  for (let i = 0; i < resourcesByIndex.length; i++) {
    const r = resourcesByIndex[i];
    const n = numbersByIndex[i];
    if (!r || r === "desert") continue;
    sums[r] += (PROB_POINTS[n] || 0);
  }

  return sums;
}

/********************
 * CHECK MINIMUM PAR RESSOURCE
 ********************/
function checkMinPipsPerResourceMap(resourcesByIndex, numbersByIndex, minMap) {
  const sums = computePipsPerResource(resourcesByIndex, numbersByIndex);
  const below = Object.keys(sums).filter(k => (sums[k] < (minMap[k] ?? 0)));
  return { ok: below.length === 0, sums, below };
}

/********************
 * ENFORCE MINIMUM PAR RESSOURCE
 ********************/
function enforceMinPipsPerResourceMap(
  resourcesByIndex,
  numbersByIndex,
  tileAdj,
  minMap,
  maxTries = 200
) {
  let tries = 0;
  let chk = checkMinPipsPerResourceMap(resourcesByIndex, numbersByIndex, minMap);

  while (!chk.ok && tries < maxTries) {
    numbersByIndex = assignNumbersWithConstraints(
      resourcesByIndex,
      NUMEROS_POOL,
      tileAdj,
      document.getElementById("sixhuit").checked,
      document.getElementById("deuxdouze").checked,
      document.getElementById("sameResRule").checked,
      document.getElementById("ressourceRule").checked,
      document.getElementById("sameNumberRule").checked
    );
    chk = checkMinPipsPerResourceMap(resourcesByIndex, numbersByIndex, minMap);
    tries++;
  }

  if (chk.ok) {
    // ✅ Ligne unique : chaque ressource = pips actuels >= minimum requis
    const ligne = Object.entries(minMap)
      .map(([r, v]) => `${r}: ${chk.sums[r]} ≥ ${v}`)
      .join(" | ");
    console.warn(`✅ Plancher pips par ressource respecté → ${ligne}`);
  } else {
    console.warn(
      "❌ Plancher non atteint après",
      maxTries,
      "essais. Trop faibles :",
      chk.below.join(", ")
    );
  }

  return { ok: chk.ok, numbersByIndex, sums: chk.sums, tries };
}

/********************
 * LOG DES PIPS PAR RESSOURCE
 ********************/
function logPipsPerResource(resourcesByIndex, numbersByIndex) {
  const sums = computePipsPerResource(resourcesByIndex, numbersByIndex);
  console.groupCollapsed("=== Pips par ressource ===");
  Object.entries(sums).forEach(([k, v]) => console.log(`${k} : ${v}`));
  console.groupEnd();
}

/********************
 * VÉRIFICATION DES PORTS
 *
 * Vérifie qu’aucune tuile forte (6 ou 8) de la même ressource
 * ne soit collée à son port 2:1 correspondant.
 ********************/
function checkPortsBalanced_DOM(resourcesByIndex, numbersByIndex, bordsImages) {
  const HOT = new Set([6, 8]); // numéros forts

  for (let idx = 0; idx < bordsImages.length; idx++) {
    const bordName = bordsImages[idx];
    const sideKey = bordToEdge[idx];
    const edgePoints = EDGES[sideKey];
    const slots = BORDS[bordName];

    for (let i = 0; i < slots.length - 1; i++) {
      const res = slots[i];
      if (!res || res === "3p1") continue;

      const vA = edgePoints[i];
      const vB = edgePoints[i + 1];
      const hexA = VERTEX_TO_HEX[vA] || [];
      const hexB = VERTEX_TO_HEX[vB] || [];

      // Cherche les hexagones communs entre les deux sommets
      const hexAdj = hexA.filter(h => hexB.includes(h));

      for (const hIdx of hexAdj) {
        const rType = resourcesByIndex[hIdx];
        const num = numbersByIndex[hIdx];

        if (rType === res && HOT.has(num)) {
          return false;
        }
      }
    }
  }

  console.warn("✅ Ports OK (aucune ressource forte collée à son port)");
  return true;
}

/********************
 * LOGS ET DEBUG VISUELS
 ********************/

/**
 * Affiche la liste des hexagones avec leur ressource et numéro.
 */
function logHexes(resourcesByIndex, numbersByIndex) {
  console.groupCollapsed("=== Hex (0..18) : res + num ===");
  for (let i = 0; i < resourcesByIndex.length; i++) {
    console.log(`Hex ${i} → ${resourcesByIndex[i]} ${numbersByIndex[i] ?? "-"}`);
  }
  console.groupEnd();
}

/**
 * Affiche les bords et les ports associés avec les ressources voisines.
 */
function logBords(resourcesByIndex, numbersByIndex, bordsImages) {
  console.groupCollapsed("=== Bords et positions ===");

  bordsImages.forEach((bordName, idx) => {
    const sideKey = bordToEdge[idx];
    const edgePoints = EDGES[sideKey];
    const slots = BORDS[bordName];

    console.group(`Bord ${bordName} → côté ${sideKey}`);

    edgePoints.forEach((vId, i) => {
      const slot = slots[i] || "-";
      const hexIdxs = VERTEX_TO_HEX[vId] || [];
      const hexInfos = hexIdxs
        .map(h => `${h}: ${resourcesByIndex[h]} ${numbersByIndex[h] ?? "-"}`)
        .join(" | ");
      console.log(`Sommet ${vId} → Hex [${hexInfos}] | Port/Slot: ${slot}`);
    });

    console.groupEnd();
  });

  console.groupEnd();
}

/**
 * Crée et log l’objet vertexData contenant :
 * - les 3 hex adjacents à chaque sommet
 * - les ports associés
 */
function logVertexData(resourcesByIndex, numbersByIndex, bordsImages) {
  vertexData = {};

  // --- Hexagones adjacents à chaque sommet ---
  for (let v = 1; v <= 54; v++) {
    const hexIdxs = VERTEX_TO_HEX[v] || [];
    vertexData[v] = {
      hexes: hexIdxs.map(h => ({
        idx: h,
        res: resourcesByIndex[h],
        num: numbersByIndex[h] ?? "-"
      })),
      ports: []
    };
  }

  // --- Ports associés à chaque sommet ---
  for (let idx = 0; idx < bordsImages.length; idx++) {
    const bordName = bordsImages[idx];
    const sideKey = bordToEdge[idx];
    const edgePoints = EDGES[sideKey];
    const slots = BORDS[bordName];

    for (let i = 0; i < slots.length; i++) {
      const res = slots[i];
      if (!res) continue;
      const vId = edgePoints[i];
      if (vertexData[vId]) vertexData[vId].ports.push(res);
    }
  }

  // --- Log complet ---
  console.groupCollapsed("=== Sommets (1..54) ===");
  Object.entries(vertexData).forEach(([v, data]) => {
    const hexInfos = data.hexes.map(h => `${h.res} ${h.num}`).join(" | ");
    const portInfos = data.ports.length ? ` | Port: ${data.ports.join(", ")}` : "";
    console.log(`Sommet ${v} → ${hexInfos}${portInfos}`);
  });
  console.groupEnd();

  return vertexData;
}

/********************
 * LECTURE DES RESSOURCES AUTOUR D’UN SOMMET
 ********************/
function getResourcesAroundVertex(vertexId) {
  const data = vertexData?.[vertexId];
  if (!data) return { ressources: [], ports: [] };

  // Récupère les ressources depuis les objets { res, num }
  const ressources = (data.hexes || [])
    .map(h => h.res)
    .filter(r => r && r !== "desert");

  // Récupère les ports éventuels
  const ports = (data.ports || []).map(p => (p === "3p1" ? "port" : p));

  return { ressources, ports };
}

// === 📐 Fonction getSommetCenterPercent ===
// Cette fonction calcule la position (x, y) en pourcentage d’un sommet du plateau,
// identifié par son numéro `id`, par rapport au conteneur principal (#plateau-container).
// Elle sert à positionner précisément des éléments (colonies, routes, etc.) sur le plateau.
//
// 🔹 Étapes :
// 1. Recherche l’élément `.pos{id}` correspondant à la position demandée.
// 2. Si l’élément n’existe pas, crée temporairement un repère invisible à cet endroit.
// 3. Utilise `getBoundingClientRect()` pour obtenir la position absolue du sommet
//    et celle du conteneur, puis calcule leur rapport en pourcentage.
// 4. Supprime le repère temporaire (si créé).
// 5. Retourne un objet `{ x, y }` donnant la position du centre du sommet en pourcentage.

function getSommetCenterPercent(id) {
  const container = document.getElementById("plateau-container");
  const layer = document.getElementById("colonies-layer");
  if (!container || !layer) return null;

  let el = document.querySelector(`.pos${id}`);
  let created = false;

  // Crée un repère invisible si le sommet n'a pas d'élément
  if (!el) {
    el = document.createElement("div");
    el.className = `pos${id}`;
    el.style.position = "absolute";
    el.style.width = "0";
    el.style.height = "0";
    el.style.visibility = "hidden";
    layer.appendChild(el);
    created = true;
  }

  // Mesures
  const r = el.getBoundingClientRect();
  const rc = container.getBoundingClientRect();
  const x = ((r.left + r.width  / 2 - rc.left) / rc.width ) * 100;
  const y = ((r.top  + r.height / 2 - rc.top ) / rc.height) * 100;

  if (created) el.remove(); // propreté

  return { x, y };
}

/********************
 * GÉNÉRATION DU PLATEAU
 ********************/
function generation(retryCount = 0) {
  if (typeof retryCount !== "number") retryCount = 0;
  console.clear();

  const maxGlobalRetries = 500;
  if (retryCount >= maxGlobalRetries) {
    console.error("❌ Échec après", maxGlobalRetries, "tentatives !");
    return;
  }

  // === Options ===
  const numeroChecked = document.getElementById("nombre").checked;
  const coloniesChecked = document.getElementById("colonie").checked;
  const routeChecked = document.getElementById("route").checked;
  const merChecked = document.getElementById("mer").checked;
  const forceDesertCentre = document.getElementById("desertCentre").checked;

  // === Règles ===
  const allow68 = document.getElementById("sixhuit").checked;
  const allow212 = document.getElementById("deuxdouze").checked;
  const allowRes = document.getElementById("sameResRule").checked;
  const allowRessourceRule = document.getElementById("ressourceRule").checked;
  const allowPortRule = document.getElementById("portRule").checked;
  const allowEquilibre = document.getElementById("equilibreRule").checked;
  const allowMinPipsPerResource = document.getElementById("minPipsPerResourceRule").checked;
  const allowSameNumber = document.getElementById("sameNumberRule").checked;

  // === Conteneur plateau ===
  const plateau = document.getElementById("plateau-container");
  plateau.innerHTML = "";

  // 🔹 Recréation systématique des calques effacés
  const routesLayer = document.createElement("div");
  routesLayer.id = "routes-layer";
  routesLayer.style.position = "absolute";
  routesLayer.style.inset = "0";
  routesLayer.style.zIndex = "45";
  routesLayer.style.pointerEvents = "none";
  plateau.appendChild(routesLayer);

  const coloniesLayer = document.createElement("div");
  coloniesLayer.id = "colonies-layer";
  coloniesLayer.style.position = "absolute";
  coloniesLayer.style.inset = "0";
  coloniesLayer.style.zIndex = "50";
  coloniesLayer.style.pointerEvents = "none";
  plateau.appendChild(coloniesLayer);

  plateau.appendChild(Object.assign(document.createElement("div"), { className: "hex-fond hex-mer" }));
  plateau.appendChild(Object.assign(document.createElement("div"), { className: "hex-fond hex-route" }));

  const carte = document.createElement("div");
  carte.id = "carteCatan";
  plateau.appendChild(carte);

  const tileAdj = buildHexAdjacency(STRUCTURE);

  // === Préparation du pool de ressources ===
  let ressourcesPool = [...RESSOURCES_POOL];
  const fixedMap = {};

  if (forceDesertCentre) {
    const desertIdx = ressourcesPool.indexOf("desert");
    if (desertIdx !== -1) ressourcesPool.splice(desertIdx, 1);
    fixedMap[9] = "desert"; // centre du plateau
  }

  // === Placement des ressources (avec contraintes et désert forcé)
  const resourcesByIndex = placeResourcesWithConstraints(
    STRUCTURE,
    ressourcesPool,
    tileAdj,
    allowRes,
    fixedMap
  );

  if (!resourcesByIndex) {
    console.warn("❌ Impossible de placer les ressources. Nouvelle tentative...");
    return generation(retryCount + 1);
  }

  // === Attribution des numéros ===
  let numbersByIndex = new Array(resourcesByIndex.length).fill(null);

  if (numeroChecked) {
    numbersByIndex = assignNumbersWithConstraints(
      resourcesByIndex,
      NUMEROS_POOL,
      tileAdj,
      allow68,
      allow212,
      allowRes,
      allowRessourceRule,
      allowSameNumber
    );

    // Vérifie équilibre global probabiliste
    if (allowEquilibre) {
      const res = enforceEquilibreSommets(resourcesByIndex, numbersByIndex, tileAdj, { min: 7, max: 11 }, 200);
      numbersByIndex = res.numbersByIndex;
      if (!res.ok) return generation(retryCount + 1);
    }

    // Vérifie plancher de pips par ressource
    if (allowMinPipsPerResource) {
      const resMin = enforceMinPipsPerResourceMap(resourcesByIndex, numbersByIndex, tileAdj, MIN_PIPS_PER_RESOURCE, 200);
      numbersByIndex = resMin.numbersByIndex;
      if (!resMin.ok) return generation(retryCount + 1);
    }
  }

  // === Création visuelle du plateau (hexagones)
  let globalIndex = 0;
  for (let row = 0; row < STRUCTURE.length; row++) {
    const ligne = document.createElement("div");
    ligne.classList.add("ligne", `ligne-${row + 1}`);

    for (let i = 0; i < STRUCTURE[row]; i++) {
      const res = resourcesByIndex[globalIndex];
      const hex = document.createElement("div");
      hex.classList.add("hex", res);
      hex.style.backgroundImage = `url('image/ressource/${res}.png')`;
      hex.dataset.hexIndex = String(globalIndex);

      if (numeroChecked && res !== "desert") {
        const numero = numbersByIndex[globalIndex];
        const imgNum = document.createElement("img");
        imgNum.src = `image/numero/${numero}.png`;
        imgNum.classList.add("numero");
        hex.appendChild(imgNum);
      }

      ligne.appendChild(hex);
      globalIndex++;
    }

    carte.appendChild(ligne);
  }

  // === Ports / Bords ===
  let bordsImages = ["b21", "b16", "b65", "b54", "b43", "b32"];
  if (merChecked) bordsImages = shuffle(bordsImages);

  bordsImages.forEach((nom, i) => {
    const bord = document.createElement("div");
    bord.className = `bord b${i + 1}`;
    const img = document.createElement("img");
    img.src = `image/bord/${nom}.png`;
    img.alt = nom;
    bord.appendChild(img);
    plateau.appendChild(bord);
  });

  // === Vérif Ports (si règle active)
  if (allowPortRule) {
    const ok = checkPortsBalanced_DOM(resourcesByIndex, numbersByIndex, bordsImages);
    if (!ok) return generation(retryCount + 1);
  }

  // === Logs finaux ===
  logHexes(resourcesByIndex, numbersByIndex);
  logBords(resourcesByIndex, numbersByIndex, bordsImages);
  vertexData = logVertexData(resourcesByIndex, numbersByIndex, bordsImages);
  logPipsPerResource(resourcesByIndex, numbersByIndex);

  console.warn("✅ Plateau généré avec succès après", retryCount, "tentative(s)");

  // === Colonies ===
  // (⚠️ on ne redéclare pas `let coloniesLayer` ici, on réutilise celui du dessus)
  coloniesLayer.innerHTML = "";
  routesLayer.innerHTML = "";

  const analyseBar = document.getElementById("analyse-bar");
  if (analyseBar) analyseBar.classList.add("hidden");

  const couleurChecked =
  ["Rouge", "Bleu", "Orange", "Beige"].some(id => document.getElementById(id)?.checked);

  if (coloniesChecked && couleurChecked) {
    afficherPions();
  } else {
    console.warn("⛔ afficherPions non exécuté : Colonie non cochée ou aucune couleur active.");
  }
}

/********************
 * CONFIGURATION SELON NIVEAU D'ÉQUILIBRAGE
 ********************/
function getSeuilsEquilibrage(niveau) {
  switch (niveau) {

    case 1: // 🎲 Random — aucun équilibrage, tout passe
      return {
        nom: 1,
        ressourcesTotales: 0,
        ressourcesDistinctes: 0,
        ressourcesParPion: 0,
        distanceMin: 2,
        boisArgileObligatoire: false,
        maxPortsParJoueur: Infinity,
        maxRatio: Infinity // aucun contrôle de ratio (random pur)
      };

    case 2: // 🔸 Medium — équilibrage standard, tolérance moyenne
      return {
        nom: 2,
        ressourcesTotales: 4,     // total ressources + ports (2 pions)
        ressourcesDistinctes: 2,  // mini 2 ressources distinctes
        ressourcesParPion: 1,     // mini 1 ressource utile par pion
        distanceMin: 2,           // distance minimale
        boisArgileObligatoire: true,
        maxPortsParJoueur: 2,     // on tolère 2 ports si variés
        maxRatio: 1.30             // écart max toléré (≈30 %)
      };

    case 3: // 🔺 Strict — génération très équilibrée
      return {
        nom: 3,
        ressourcesTotales: 5,
        ressourcesDistinctes: 3,
        ressourcesParPion: 2,
        distanceMin: 4,
        boisArgileObligatoire: true,
        maxPortsParJoueur: 1,     // un seul port autorisé
        maxRatio: 1.10            // écart max 10 % entre joueurs
      };

    default:
      console.warn("⚠️ Niveau inconnu, utilisation du mode Medium par défaut.");
      return getSeuilsEquilibrage(2);
  }
}

/********************
 * AFFICHAGE COLONIES — version stricte complète
 * + ports listés séparément en fin
 ********************/
function afficherPions(maxTries = 200) {
  // 🧭 Réinitialisation du flag au début d'une nouvelle génération de pions
  window.__isFinalBoard = false;

  // 🔹 Calque colonies
  const coloniesLayer = document.getElementById("colonies-layer");
  const routesLayer = document.getElementById("routes-layer");
  const routeActive = document.getElementById("route").checked;

  coloniesLayer.innerHTML = "";
  routesLayer.innerHTML = "";

  // --- Couleurs actives ---
  const couleurs = [];
  ["Rouge", "Bleu", "Orange", "Beige"].forEach(c => {
    if (document.getElementById(c)?.checked) couleurs.push(c.toLowerCase());
  });

  if (couleurs.length === 0) {
    console.warn("⚠️ Aucune couleur sélectionnée !");
    return;
  }

  const niveau = Number(document.querySelector('input[name="niveauEquilibre"]:checked')?.value || 1);
  const seuils = getSeuilsEquilibrage(niveau);

  let success = false;
  let essais = 0;

  window.__isFinalBoard = false;

  // === Tentatives d’équilibrage ===
  while (!success && essais < maxTries) {
    essais++;
    coloniesLayer.innerHTML = "";
    routesLayer.innerHTML = "";
    routesExistantes.clear();

    let positionsDisponibles = Array.from({ length: 54 }, (_, i) => i + 1);
    const pionsJoueurs = {};
    let allOK = true;

    // --- Ordre de pose : aller puis retour ---
    const ordrePose = [...couleurs, ...[...couleurs].reverse()];
    
    for (const couleur of ordrePose) {
      let pion = null;
      let essaisPion = 0;
      let valide = false;

      while (!valide && essaisPion < 300) {
        essaisPion++;
        pion = positionsDisponibles[Math.floor(Math.random() * positionsDisponibles.length)];

        const info = getResourcesAroundVertex(pion);
        const ressources = new Set(info.ressources);
        const ports = new Set(info.ports);
        const totalAvecPorts = new Set([...ressources, ...ports]);

        const autrePion = pionsJoueurs[couleur]?.[0];

        let okDistance = true;
        let okRessources = totalAvecPorts.size >= seuils.ressourcesParPion;
        let okBoisArgile =
          !seuils.boisArgileObligatoire || totalAvecPorts.has("bois") || totalAvecPorts.has("argile");

        if (autrePion) {
          const dist = getDistanceEntreSommets(autrePion, pion);
          okDistance = dist >= seuils.distanceMin;
        }

        valide = okDistance && okRessources && okBoisArgile;
      }

      if (!valide) {
        allOK = false;
        break;
      }

      // --- Placement visuel du pion ---
      const pionDiv = document.createElement("div");
      pionDiv.classList.add("pion", `pos${pion}`, `col-${couleur}`);
      pionDiv.dataset.couleur = couleur; // 🔒 couleur réelle du pion stockée en data
      coloniesLayer.appendChild(pionDiv);

      if (!pionsJoueurs[couleur]) pionsJoueurs[couleur] = [];
      pionsJoueurs[couleur].push(pion);

      // === 🧩 Route décorative à côté du pion (responsive et simple) ===
      if (routeActive) {
        // lance après que le pion est ajouté au DOM
        
        poserUneRouteDepuisPion(pion, couleur);
      }

      // --- Exclusion des sommets voisins ---
      const interdits = new Set([pion]);
      (VERTEX_ADJ[pion] || []).forEach(v => interdits.add(v));
      positionsDisponibles = positionsDisponibles.filter(p => !interdits.has(p));
    }

    if (!allOK) continue;

    /*****************************
     * Vérifications globales par joueur
     *****************************/
    let allPlayersOK = true;
    const logDetails = [];

    for (const couleur of couleurs) {
      const [pionA, pionB] = pionsJoueurs[couleur] || [];
      if (!pionA || !pionB) {
        allPlayersOK = false;
        continue;
      }

      const infoA = getResourcesAroundVertex(pionA);
      const infoB = getResourcesAroundVertex(pionB);

      const nbResA = new Set(infoA.ressources).size;
      const nbPortsA = (infoA.ports || []).length;
      const nbParPionA = nbResA + nbPortsA;

      const nbResB = new Set(infoB.ressources).size;
      const nbPortsB = (infoB.ports || []).length;
      const nbParPionB = nbResB + nbPortsB;

      const totalRessources = new Set([...infoA.ressources, ...infoB.ressources]);
      const totalPorts = [...(infoA.ports || []), ...(infoB.ports || [])];
      const totalAvecPortsUnique = [...new Set([...totalRessources, ...totalPorts])];
      const totalAvecPortsListe = [...infoA.ressources, ...infoB.ressources, ...totalPorts];
      const presentBoisArgile = ["bois", "argile"].filter(x => totalAvecPortsUnique.includes(x));

      const nbTotal = totalAvecPortsListe.length;
      const nbDistinct = totalRessources.size;
      const distance = getDistanceEntreSommets(pionA, pionB);

      const okTotal = nbTotal >= seuils.ressourcesTotales;
      const okDistinct = nbDistinct >= seuils.ressourcesDistinctes;
      const okParPion =
        nbParPionA >= seuils.ressourcesParPion && nbParPionB >= seuils.ressourcesParPion;
      const okBoisArgile =
        !seuils.boisArgileObligatoire || presentBoisArgile.length > 0;
      const okDistance = distance >= seuils.distanceMin;
      const okPorts = totalPorts.length <= seuils.maxPortsParJoueur;

      const toutOK =
        okTotal && okDistinct && okParPion && okBoisArgile && okDistance && okPorts;
      if (!toutOK) allPlayersOK = false;

      logDetails.push({
        couleur,
        pions: [pionA, pionB],
        distance,
        infoA,
        infoB,
        ok: { toutOK, okPorts }
      });
    }

    // === Validation finale ===
    if (allPlayersOK) {
      // 🧱 Vérification finale : toutes les routes posées ?
      const nbRoutes = routesExistantes.size;

      if (routeActive && nbRoutes === 0) {
        // 🚫 Cas 1 : routes activées mais aucune posée → on relance
        console.warn("⚠️ Aucune route détectée alors que l’option 'route' est active → nouvelle tentative");
        success = false;
      } else {
        // ✅ Cas 2 : routes désactivées OU présentes → on peut analyser
        const analyse = analyseEquilibrageGlobal(logDetails, niveau, { log: false });

        if (analyse && analyse.ok) {
          // 🧩 Plateau validé
          if (!window.__isFinalBoard) {
            window.__isFinalBoard = true;

            console.log(
              `🎯 Plateau final validé (niveau ${seuils.nom}) — affichage complet des logs`
            );

            // 🔁 Deuxième passe avec logs complets
            analyseFinale = analyseEquilibrageGlobal(logDetails, niveau, { log: true });
            resultat = logDetails;
          } else {
            console.log("🟢 Plateau déjà loggé dans cette génération — aucun doublon");
          }

          success = true;
        } else {
          // ❌ Cas 3 : analyse invalide ou échec
          success = false;
          window.__isFinalBoard = false;
        }
      }
    }



  }

  /*****************************
   * LOG FINAL + RÉGÉNÉRATION SI ÉCHEC
   *****************************/
  if (!success) {
    console.warn(`💥 Aucun placement équilibré trouvé après ${maxTries} essais.`);
    console.warn("🔁 Nouvelle génération complète du plateau...");
    generation();
    return;
  } else {
    console.warn(
      `✅ Pions générés avec succès (niveau ${seuils.nom}) après ${essais} tentative${essais > 1 ? "s" : ""}`
    );
  }
}

/********************
 * ÉTAPE 3 — ANALYSE D'ÉQUILIBRAGE GLOBAL
 ********************/
function analyseEquilibrageGlobal(joueurs, niveau, opts = { log: true }) {
  const seuils = getSeuilsEquilibrage(niveau);
  const maxRatio = seuils.maxRatio ?? 1.3;

  const tousLesPions = joueurs.flatMap(j => j.pions);

  const details = joueurs.map(j => {
    const couleurJoueur = j.couleur || "inconnu";

    // 🔁 IMPORTANT : on propage le flag de log
    const position = analysePositionJoueur(j.pions, tousLesPions, couleurJoueur, { log: !!opts.log });
    const ouvertureBrute = position.scoreOuverture;
    const facteurOuverture = position.ratioOuverture;
    const ouvertureNote10 = ouvertureBrute.toFixed(2);

    const hexesA = vertexData[j.pions[0]]?.hexes || [];
    const hexesB = vertexData[j.pions[1]]?.hexes || [];
    const hexes = [...hexesA, ...hexesB];

    const PROB_POINTS = { 2:1, 3:2, 4:3, 5:4, 6:5, 8:5, 9:4, 10:3, 11:2, 12:1 };
    const COEF_RESSOURCE = { argile:1.2, bois:1.1, ble:1.0, pierre:0.9, minerai:0.9, mouton:0.8 };

    let pipsBruts = 0, pipsPondere = 0;
    const pipsDetail = {};
    hexes.forEach(h => {
      if (!h.res || h.res === "desert" || !h.num) return;
      const p = PROB_POINTS[h.num] || 0;
      const c = COEF_RESSOURCE[h.res] ?? 1;
      const pond = p * c;
      pipsBruts += p; pipsPondere += pond;
      if (!pipsDetail[h.res]) pipsDetail[h.res] = { brut: 0, pond: 0, coef: c };
      pipsDetail[h.res].brut += p; pipsDetail[h.res].pond += pond;
    });

    const diversite = Object.keys(pipsDetail).length;
    const facteurDiversite = 1 + 0.3 * Math.log(diversite > 0 ? diversite : 1);
    const facteurDiversiteTxt = `1 + 0.3×ln(${diversite}) = ${facteurDiversite.toFixed(2)}`;

    const ports = [...(j.infoA?.ports || []), ...(j.infoB?.ports || [])];
    const portsDetail = [];
    let valeurPorts = 0;
    ports.forEach(port => {
      if (port === "3p1" || port === "port" || port === "3:1") {
        valeurPorts += 3.0;
        portsDetail.push(`port 3:1 = 3.00`);
      } else {
        const pipsRessource = hexes.filter(h => h.res === port && h.num && !isNaN(h.num))
          .reduce((a,h)=>a+(PROB_POINTS[h.num]||0),0);
        const synergique = pipsRessource>0;
        const val = synergique?1.5+0.6*pipsRessource:1.0;
        valeurPorts += val;
        portsDetail.push(`port 2:1 ${port} ${synergique?"synergique":"non-synergique"} = ${val.toFixed(2)}`);
      }
    });

    const core = pipsPondere * facteurDiversite + valeurPorts;
    const score = core * facteurOuverture;

    return {
      couleur: couleurJoueur,
      pipsBruts, pips: pipsPondere, pipsDetail,
      diversite, facteurDiversite, facteurDiversiteTxt,
      ports, portsDetail, valeurPorts,
      core, score,
      facteurOuverture, ouvertureNote10,
      ratioOuverture: facteurOuverture,
      scoreOuverture: ouvertureBrute
    };
  });

  const scores = details.map(d => d.score);
  const ratio = Math.max(...scores) / Math.min(...scores);
  const ok = ratio <= maxRatio;

    // --- Création de l’objet des scores par couleur ---
  const scoresObj = {};
  details.forEach(d => {
    scoresObj[d.couleur] = d.score;
  });

  if (opts.log) {
    const emojiCouleur = {
      rouge: "🔴", bleu: "🔵", orange: "🟠", beige: "⚪", vert: "🟢",
      violet: "🟣", jaune: "🟡", noir: "⚫",
    };
    const couleursConsole = {
      rouge: "#e74c3c", bleu: "#3498db", vert: "#27ae60", orange: "#e67e22",
      jaune: "#f1c40f", beige: "#d2b48c", violet: "#9b59b6", noir: "#2c3e50",
    };

    const minScore = Math.min(...details.map(d => d.score));
    const maxScore = Math.max(...details.map(d => d.score));
    const joueurMin = details.find(d => d.score === minScore);
    const joueurMax = details.find(d => d.score === maxScore);

    const parts = details
      .map(d => {
        const emoji = emojiCouleur[d.couleur?.toLowerCase()] || "⚪";
        return `%c${emoji} ${d.score.toFixed(2)}%c`;
      })
      .join(" │ ");

    const couleursTexte = details.flatMap(d => [
      `color:${( {rouge:"#e74c3c", bleu:"#3498db", vert:"#27ae60", orange:"#e67e22", jaune:"#f1c40f", beige:"#d2b48c", violet:"#9b59b6", noir:"#2c3e50"} )[d.couleur?.toLowerCase()] || "#ccc"}; font-weight:bold;`,
      "color:inherit;"
    ]);

    console.groupCollapsed(
      [
        `🧮 Analyse inter-joueurs │ Niveau: ${seuils.nom}`,
        parts,
        `│ ⬇️ Min: %c${({rouge:"🔴", bleu:"🔵", orange:"🟠", beige:"⚪", vert:"🟢", violet:"🟣", jaune:"🟡", noir:"⚫"})[joueurMin.couleur]} ${minScore.toFixed(2)}%c`,
        `│ ⬆️ Max: %c${({rouge:"🔴", bleu:"🔵", orange:"🟠", beige:"⚪", vert:"🟢", violet:"🟣", jaune:"🟡", noir:"⚫"})[joueurMax.couleur]} ${maxScore.toFixed(2)}%c`,
        `│ ⚖️ Ratio: ${ratio.toFixed(2)} (≤ ${maxRatio.toFixed(2)}) ${ok ? "✅" : "❌"}`
      ].join(" "),
      ...couleursTexte,
      `color:${({rouge:"#e74c3c", bleu:"#3498db", vert:"#27ae60", orange:"#e67e22", jaune:"#f1c40f", beige:"#d2b48c", violet:"#9b59b6", noir:"#2c3e50"})[joueurMin.couleur?.toLowerCase()] || "#ccc"}; font-weight:bold;`,
      "color:inherit;",
      `color:${({rouge:"#e74c3c", bleu:"#3498db", vert:"#27ae60", orange:"#e67e22", jaune:"#f1c40f", beige:"#d2b48c", violet:"#9b59b6", noir:"#2c3e50"})[joueurMax.couleur?.toLowerCase()] || "#ccc"}; font-weight:bold;`,
      "color:inherit;"
    );

    details.forEach(d => {
      const color = ({rouge:"#e74c3c", bleu:"#3498db", vert:"#27ae60", orange:"#e67e22",
                      jaune:"#f1c40f", beige:"#d2b48c", violet:"#9b59b6", noir:"#2c3e50"})[d.couleur?.toLowerCase()] || "#bdc3c7";

      const ressourcesLignes = Object.entries(d.pipsDetail)
        .map(([res, v]) => `${res[0].toUpperCase() + res.slice(1)} = ${v.brut} × ${v.coef.toFixed(2)} = ${v.pond.toFixed(2)}`)
        .join("\n");

      const totalLigne = Object.values(d.pipsDetail)
        .reduce((acc, v) => acc + v.pond, 0)
        .toFixed(2);

      console.log(
        `%c${d.couleur.toUpperCase()}`,
        `color:${color}; font-weight:bold;`,
        `\n🎲  Pips : bruts ${d.pipsBruts.toFixed(2)} │ pondérés ${d.pips.toFixed(2)}`,
        ressourcesLignes
          ? "\n" + ressourcesLignes.split("\n").map(l => "        ↳ " + l).join("\n") + `\n          → Total pondéré = ${totalLigne}`
          : "",
        `\n🌈  Diversité : ${d.diversite}/5  │  facteur ${d.facteurDiversiteTxt}`,
        `\n⚓  Ports :\n` +
          (d.portsDetail.length
            ? d.portsDetail.map(p => "        ↳ " + p).join("\n") + `\n          → Total = ${d.valeurPorts.toFixed(2)}`
            : "          ↳ Aucun port"),
        `\n💠  Ouverture : Score qualité = ${d.ouvertureNote10} │ Coef ouverture = ${d.facteurOuverture.toFixed(2)}`
      );

      const shownPips   = Number(d.pips.toFixed(2));
      const shownFD     = Number(d.facteurDiversite.toFixed(2));
      const shownPorts  = Number(d.valeurPorts.toFixed(2));
      const shownCoef   = Number(d.facteurOuverture.toFixed(2));
      const intermediaire = shownPips * shownFD + shownPorts;
      const scoreShown = intermediaire * shownCoef;

      console.log(
        `%c💰  Score final = (${shownPips} × ${shownFD} + ${shownPorts}) × ${shownCoef} = ${intermediaire.toFixed(2)} × ${shownCoef} = %c${scoreShown.toFixed(2)}`,
        "color: inherit;",
        "color: gold; font-weight: bold;"
      );

      console.log("─────────────────────────────────────────────");
    });

    const best = details.reduce((a, b) => (a.score > b.score ? a : b));
    const worst = details.reduce((a, b) => (a.score < b.score ? a : b));
    const colorBest = ({rouge:"#e74c3c", bleu:"#3498db", vert:"#27ae60", orange:"#e67e22",
                        jaune:"#f1c40f", beige:"#d2b48c", violet:"#9b59b6", noir:"#2c3e50"})[best.couleur?.toLowerCase()] || "white";
    const colorWorst = ({rouge:"#e74c3c", bleu:"#3498db", vert:"#27ae60", orange:"#e67e22",
                         jaune:"#f1c40f", beige:"#d2b48c", violet:"#9b59b6", noir:"#2c3e50"})[worst.couleur?.toLowerCase()] || "white";

    console.log("%c📊 Résumé global :", "font-weight:bold; color:gold;");
    console.log(`➕ Score max : %c${best.couleur.toUpperCase()}%c (${best.score.toFixed(2)})`,
      `color:${colorBest}; font-weight:bold;`, "color:inherit;");
    console.log(`➖ Score min : %c${worst.couleur.toUpperCase()}%c (${worst.score.toFixed(2)})`,
      `color:${colorWorst}; font-weight:bold;`, "color:inherit;");
    console.log(`⚖️ Ratio max/min : ${ratio.toFixed(2)} (≤ ${maxRatio.toFixed(2)}) ${ok ? "✅" : "❌"}`);
    
    if (!ok) console.warn("⚠️ Écart trop important : équilibrage inter-joueurs à ajuster.");
    console.groupEnd();

    // --- ✅ Affichage automatique sur la page ---
    if (typeof afficherAnalyse === "function") {
      const seuilsActuels = getSeuilsEquilibrage(niveau);
      afficherAnalyse({
        niveau: seuilsActuels.nom,
        scores: scoresObj,
        ratio,
        ratioCap: maxRatio
      });
    }
  }



  // --- Retour complet pour usage interne ---
  return { ok, ratio, maxRatio, details, scores: scoresObj };
}

/********************
 * PHASE 4 — ANALYSE POSITIONNELLE D’UN JOUEUR (fusion routes + sommets)
 ********************/
function analysePositionJoueur(pionsJoueur, tousLesPions, couleurJoueur = "inconnu", opts = { log: false }) {
  const DO_LOG = !!opts.log;

  // --- Données de base ---
  const pionsAdverses = tousLesPions.filter(p => !pionsJoueur.includes(p));
  const PROB_POINTS = { 2:1, 3:2, 4:3, 5:4, 6:5, 8:5, 9:4, 10:3, 11:2, 12:1 };
  const COEF_RESSOURCE = { argile:1.2, bois:1.1, ble:1.0, pierre:0.9, minerai:0.9, mouton:0.8 };

  const sommetsVisites = new Set();        // Global : pour tous les pions
  const routesDejaLog = new Set();         // Évite les doublons de log sur routes bloquantes
  let sommeQualiteGlobale = 0;
  const detailsPions = [];

  const colorStyle =
    couleurJoueur === "rouge"  ? "crimson" :
    couleurJoueur === "bleu"   ? "#00aaff" :
    couleurJoueur === "orange" ? "orange" :
    couleurJoueur === "beige"  ? "#c2a572" : "white";

  // --- Ressources du joueur ---
  const ressourcesPossedees = new Set();
  for (const p of pionsJoueur)
    (vertexData[p]?.hexes || []).forEach(h => {
      if (h.res && h.res !== "desert") ressourcesPossedees.add(h.res);
    });

  // --- Fonction de qualité ---
  function qualiteSommet(id) {
    const hexes = vertexData[id]?.hexes || [];
    const ports = vertexData[id]?.ports || [];
    let total = 0;
    const logParts = [];

    for (const h of hexes) {
      if (h.res && h.num && !isNaN(h.num)) {
        const p = PROB_POINTS[h.num] || 0;
        const c = COEF_RESSOURCE[h.res] || 1;
        const val = p * c;
        total += val;
        logParts.push(`⚙️ ${h.res}(${h.num}) = ${p}×${c} = ${val.toFixed(2)}`);
      }
    }

    for (const p of ports) {
      if (["3p1", "port", "3:1"].includes(p)) {
        total += 3;
        logParts.push(`⚓ port 3:1 → +3 pts`);
      } else {
        const res = p;
        const possede = ressourcesPossedees.has(res);
        const pipsAdj = hexes
          .filter(h => h.res === res && h.num && !isNaN(h.num))
          .reduce((a, h) => a + (PROB_POINTS[h.num] || 0), 0);
        const val = possede || pipsAdj > 0 ? 1.5 + 0.6 * pipsAdj : 1;
        total += val;
        logParts.push(`⚓ port ${res} ${(possede || pipsAdj > 0) ? "synergique" : "non-synergique"} → +${val.toFixed(2)} pts`);
      }
    }

    return { total, logParts };
  }

  // --- Vérifie si un sommet est libre ---
  function estAccessible(id) {
    for (const adv of pionsAdverses)
      if (getDistanceEntreSommets(id, adv) < 2) return false;
    for (const pj of pionsJoueur)
      if (getDistanceEntreSommets(id, pj) < 2) return false;
    return true;
  }

  // --- Exploration BFS ---
  function exploreDepuis(source, maxDepth, { viaRouteBase = false, localSet, sommeLocaleRef, sommeGlobaleRef }) {
    const frontier = [[source, 0]];
    const visitedLocal = new Set([source]);
    const picks = [];

    while (frontier.length) {
      const [current, depth] = frontier.shift();
      if (depth >= maxDepth) continue;

      const voisins = VERTEX_ADJ[current] || [];
      for (const v of voisins) {
        if (visitedLocal.has(v)) continue;
        visitedLocal.add(v);

        // 🚫 Blocages
        if (tousLesPions.includes(v)) continue;
        if (routeExiste(current, v)) {
          const cleNorm = `${Math.min(current, v)}-${Math.max(current, v)}`;
          if (!routesDejaLog.has(cleNorm)) {
            routesDejaLog.add(cleNorm);
            if (DO_LOG) {
              const couleurR = routeCouleur?.(current, v) || "inconnue";
              console.log(`🚫 Route ${couleurR} ${current}–${v} → bloqué pour tous`);
            }
          }
          continue;
        }

        frontier.push([v, depth + 1]);
        if (!estAccessible(v)) continue;

        // --- Calcul de la qualité ---
        const { total: q, logParts } = qualiteSommet(v);
        const dejaGlobal = sommetsVisites.has(v);
        const dejaLocal = localSet.has(v);
        const viaRoute = viaRouteBase;

        let couleur = "limegreen";
        let prefix = viaRoute ? "✅ Nouveau sommet via route" : "✅ Nouveau sommet";

        if (!dejaGlobal && !dejaLocal) {
          sommetsVisites.add(v);
          localSet.add(v);
          sommeQualiteGlobale += q;
          sommeLocaleRef.value += q;
          sommeGlobaleRef.value += q;
        } else if (dejaGlobal && !dejaLocal) {
          localSet.add(v);
          sommeLocaleRef.value += q;
          couleur = "orange";
          prefix = `⚠️ Doublon global${viaRoute ? " via route" : ""} (non compté globalement)`;
        } else if (dejaLocal) {
          couleur = "#ff5f38ff";
          prefix = `⚠️ Doublon local${viaRoute ? " via route" : ""} (ignoré)`;
        }

        picks.push({ id: v, profondeur: depth + 1, qualite: q, viaRoute });

        if (DO_LOG) {
          console.groupCollapsed(`%c${prefix} ${v} | dist=${depth + 1} | q=${q.toFixed(2)}`, `color:${couleur}`);
          logParts.forEach(l => console.log(" " + l));
          console.groupEnd();
        }
      }
    }

    return picks;
  }

  // --- Début du log joueur ---
  if (DO_LOG) {
    const emojiCouleur =
      couleurJoueur === "rouge"  ? "🔴" :
      couleurJoueur === "bleu"   ? "🔵" :
      couleurJoueur === "orange" ? "🟠" :
      couleurJoueur === "beige"  ? "⚪"  : "⚫";

    console.groupCollapsed(
      `%c${emojiCouleur} Joueur ${couleurJoueur.toUpperCase()} — ${pionsJoueur.join(", ")}`,
      `color:${colorStyle}; font-weight:bold;`
    );
  }


  // === Parcours des pions ===
  for (const pion of pionsJoueur) {
    const localSet = new Set();
    const sommeLocaleRef = { value: 0 };
    const sommeGlobaleRef = { value: 0 };
    const sommetsLocaux = [];

    if (DO_LOG) console.groupCollapsed(`%c📍 Pion ${pion}`, `color:${colorStyle}; font-weight:bold;`);

    // --- Route liée ---
    const routesLiees = Array.from(routesExistantes)
      .filter(cle => {
        const [a, b] = cle.split("-").map(Number);
        return (a === pion || b === pion) && routesCouleurs[cle] === couleurJoueur;
      });

    let sommetRelie = null;
    if (routesLiees.length > 0) {
      const cle = routesLiees[0];
      const [a, b] = cle.split("-").map(Number);
      sommetRelie = (a === pion ? b : a);
      routesDejaLog.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    } else if (DO_LOG) {
      console.log(`⚠️ Aucune route détectée pour pion ${pion}`);
    }

    // --- Qualité du pion actuel ---
    const { total: qPion, logParts: lPion } = qualiteSommet(pion);
    if (DO_LOG) {
      console.log("%c─────────────── 📍 Pions ───────────────", "color:gray; font-weight:bold;");
      console.groupCollapsed(`%c📍 Qualité du pion actuel : ${qPion.toFixed(2)} pts (ignoré)`, "color:gold; font-weight:bold;");
      lPion.forEach(l => console.log(" " + l));
      console.groupEnd();
    }

    // === BFS depuis le pion et depuis sa route ===
    const picks1 = exploreDepuis(pion, 3, { viaRouteBase: false, localSet, sommeLocaleRef, sommeGlobaleRef });
    picks1.forEach(p => sommetsLocaux.push(p));

    if (DO_LOG){
      console.log("%c─────────────── 🛣️ Routes ───────────────", "color:gray; font-weight:bold;");
      console.log(`%c🛣️ Route du pion ${pion} vers ${sommetRelie}`, `color:gold; font-weight:bold;`); 
    }
           

    if (sommetRelie != null) {
      const picks2 = exploreDepuis(sommetRelie, 3, { viaRouteBase: true, localSet, sommeLocaleRef, sommeGlobaleRef });
      picks2.forEach(p => sommetsLocaux.push(p));
    }

    if (DO_LOG) {
      console.log(`→ Somme locale : ${sommeLocaleRef.value.toFixed(2)} pts | somme globale : ${sommeGlobaleRef.value.toFixed(2)} pts`);
      console.groupEnd();
    }

    detailsPions.push({ pion, nb: sommetsLocaux.length, sommeLocale: sommeLocaleRef.value });
  }

  // --- Synthèse joueur ---
  if (DO_LOG) {
    console.groupCollapsed("📊 Synthèse joueur");
    console.log(`Sommets uniques colonisables : ${sommetsVisites.size}`);
    console.log(`Somme totale des pips pondérés (score d’ouverture) : ${sommeQualiteGlobale.toFixed(2)}`);
    detailsPions.forEach(p =>
      console.log(`Pion ${p.pion} → ${p.nb} sommets | total qualité = ${p.sommeLocale.toFixed(2)}`)
    );
    console.groupEnd();
    console.groupEnd();
  }

  // --- Ratio ouverture ---
  const s = Math.min(Math.max(sommeQualiteGlobale, 0), 130); // borne [0,130]
  const Cmin = 0.70, Cmax = 1.20;
  const routeChecked = document.getElementById("route").checked;

  // Sélection des coefficients (avec ou sans route)
  const a = routeChecked ? 2.9 : 2.6;
  const b = routeChecked ? 1.25 : 1.9;

  // Calcul du ratio
  const x = s / 130;
  const xa = Math.pow(x, a);
  const oneMinus = Math.pow(1 - x, b);
  const g = xa / (xa + oneMinus);

  const ratioOuverture = Cmin + (Cmax - Cmin) * g

  return {
    scoreOuverture: sommeQualiteGlobale,
    ratioOuverture,
    sommetsAccessibles: sommetsVisites.size,
    sommeQualite: sommeQualiteGlobale,
    detailsPions
  };
}

// === 🧩 Fonction afficherAnalyse ===
// Cette fonction met à jour le bandeau d’analyse affiché en bas de la page
// après la génération d’un plateau (niveaux, ratios, scores par couleur).
// Elle gère aussi la traduction FR/EN et ne s’affiche que si les options
// “colonie” et au moins une couleur sont cochées
function afficherAnalyse({ niveau, scores, ratio, ratioCap = 1.10 }) {
  const analyseBar = document.getElementById("analyse-bar");
  if (!analyseBar) return;

  // Cache systématiquement au début
  analyseBar.classList.add("hidden");

  // Vérifie si les options "Colonie" et "Nombre" sont cochées
  const colonieChecked = document.getElementById("colonie")?.checked ?? false;
  const nombreChecked = document.getElementById("nombre")?.checked ?? false;

  // Vérifie les couleurs actives
  const couleursActives = ["Rouge", "Bleu", "Orange", "Beige"]
    .filter(c => document.getElementById(c)?.checked)
    .map(c => c.toLowerCase());

  // Si aucune colonie ou couleur → on sort sans rien faire
  if (!colonieChecked || !nombreChecked ||  couleursActives.length === 0) return;

  // Détecte la langue courante
  const currentLang =
    document.documentElement.lang ||
    document.querySelector("html").getAttribute("lang") ||
    "fr";

  // Détermine le libellé du niveau selon la langue
  const libNiv = i18n[currentLang]?.[`niv${niveau}`] 
              ?? i18n.fr?.[`niv${niveau}`] 
              ?? niveau;


  // Met à jour les badges
  const niveauBadge = document.getElementById("niveau-badge");
  const ratioBadge = document.getElementById("ratio-badge");
  if (!niveauBadge || !ratioBadge) return;

  // --- Badges traduits via i18n ---
  const niveauLabel = i18n[currentLang]?.niveau ?? "Balancing";
  const ratioLabel = i18n[currentLang]?.ratio ?? "Ratio";

  niveauBadge.textContent = `${niveauLabel} : ${libNiv}`;
  ratioBadge.textContent = `${ratioLabel} : ${ratio.toFixed(2)} (≤ ${ratioCap.toFixed(2)})`;


  ratioBadge.classList.remove("badge-ok", "badge-warn", "badge-danger");
  ratioBadge.classList.add(
    ratio <= ratioCap
      ? "badge-ok"
      : ratio <= ratioCap + 0.03
      ? "badge-warn"
      : "badge-danger"
  );

  // Met à jour la bande des scores
  const strip = document.getElementById("scores-strip");
  const fmt = v => Number(v).toFixed(2);
  const lignes = [];

  if (couleursActives.includes("rouge"))
    lignes.push(`<span><span class="dot dot-rouge"></span>${fmt(scores.rouge ?? 0)}</span>`);
  if (couleursActives.includes("bleu"))
    lignes.push(`<span><span class="dot dot-bleu"></span>${fmt(scores.bleu ?? 0)}</span>`);
  if (couleursActives.includes("orange"))
    lignes.push(`<span><span class="dot dot-orange"></span>${fmt(scores.orange ?? 0)}</span>`);
  if (couleursActives.includes("beige"))
    lignes.push(`<span><span class="dot dot-beige"></span>${fmt(scores.beige ?? 0)}</span>`);

  strip.innerHTML = lignes.join(" | ");

  // Affiche seulement si conditions valides
  analyseBar.classList.remove("hidden");
  console.log("✅ analyse-bar affiché !");
}

// === 🚀 Fonction demarrerGeneration ===
// Cette fonction est appelée quand l’utilisateur clique sur “Génération”.
// Elle gère l’état visuel du bouton (grisé + texte animé), attend un court
// instant pour que le navigateur rafraîchisse l’affichage, puis lance
// réellement la génération du plateau via la fonction generation().
function demarrerGeneration(e, retryCount = 0) {
  if (e) e.preventDefault();
  e.stopPropagation();
  e.target.blur(); // ← empêche Safari de refocus en haut
  
  const btn = document.getElementById("btn-generation");
  if (!btn) return;

  const originalText = btn.textContent;

  // 🕓 Démarre le chronomètre haute précision
  const startTime = performance.now();

    btn.disabled = true;
    btn.classList.add("loading");

    const lang = document.documentElement.lang || "fr";
    btn.textContent = i18n[lang]?.boutonLoading ?? "Génération...";

  setTimeout(() => {
    generation(retryCount);

    // 🧭 Fin du chronomètre
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // 📜 Log clair en console
    console.log(
      `✅ Génération terminée en ${duration}s`
    );

      btn.disabled = false;
      btn.classList.remove("loading");
      btn.textContent = originalText;
  }, 100);
}


/********************
 * AUTO-LAUNCH
 ********************/
window.onload = () => {
  const fonds = document.querySelectorAll(".hex-fond");

  // 1️⃣ Réinitialise proprement (invisible sans transition)
  fonds.forEach(f => {
    f.classList.remove("visible");
    f.style.transition = "none";
    f.style.opacity = "0";
  });

  // 2️⃣ Lance la génération
  demarrerGeneration();

  // 3️⃣ Laisse le temps au rendu, puis affiche avec transition
  setTimeout(() => {
    fonds.forEach(f => {
      f.style.transition = "opacity 0.4s ease";
      f.classList.add("visible");
    });
  }, 100);
};