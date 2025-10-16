// === build.js ===
// 🚀 Script de build pour Catan Random : copie, minifie et prépare la version de démo

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const src = "./";
const dist = "./build";

// 🧹 1️⃣ Suppression du dossier build existant
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
  console.log("🧹 Ancien dossier build supprimé");
}
fs.mkdirSync(dist);
console.log("📁 Nouveau dossier build créé");

// 🧩 2️⃣ Fonction utilitaire : copie récursive (fichiers + dossiers)
function copyRecursive(srcPath, destPath) {
  if (!fs.existsSync(srcPath)) return;

  const stats = fs.statSync(srcPath);
  if (stats.isDirectory()) {
    if (!fs.existsSync(destPath)) fs.mkdirSync(destPath);
    for (const file of fs.readdirSync(srcPath)) {
      copyRecursive(path.join(srcPath, file), path.join(destPath, file));
    }
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

// 📦 3️⃣ Copie des fichiers et dossiers nécessaires
const toCopy = ["index.html", "lang.js", "image"];
for (const f of toCopy) {
  if (fs.existsSync(f)) {
    console.log(`📦 Copie de ${f}...`);
    copyRecursive(f, path.join(dist, f));
  } else {
    console.warn(`⚠️ Fichier introuvable : ${f}`);
  }
}

// 🔧 4️⃣ Minification JS
if (fs.existsSync("script.js")) {
  console.log("🔧 Minification JS...");
  execSync(
    `npx terser script.js -o ${dist}/script.min.js --compress drop_console=true,drop_debugger=true --mangle`,
    { stdio: "inherit" }
  );
}

// 🎨 5️⃣ Minification CSS
if (fs.existsSync("style.css")) {
  console.log("🎨 Minification CSS...");
  execSync(`npx cleancss -o ${dist}/style.min.css style.css`, {
    stdio: "inherit",
  });
}

// 🔗 6️⃣ Mise à jour du index.html pour pointer vers les fichiers minifiés
const indexPath = path.join(dist, "index.html");
if (fs.existsSync(indexPath)) {
  console.log("🧩 Mise à jour du index.html pour la version minifiée...");
  let html = fs.readFileSync(indexPath, "utf-8");

  html = html
    // remplace les fichiers CSS/JS non minifiés
    .replace(/style\.css/g, "style.min.css")
    .replace(/script\.js/g, "script.min.js");

  fs.writeFileSync(indexPath, html, "utf-8");
  console.log("🔗 index.html mis à jour pour utiliser les fichiers minifiés.");
}

// ✅ 7️⃣ Fin du processus
console.log("\n✅ Build terminée avec succès !");
console.log("📂 Fichiers disponibles dans le dossier 'build/'");
