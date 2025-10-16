// === build.js ===
// Script de build pour Catan Random : copie et minifie

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const src = "./";
const dist = "./build";

// 🧹 1. Nettoyer le dossier build
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
  console.log("🧹 Ancien dossier build supprimé");
}
fs.mkdirSync(dist);

// 📁 2. Copier récursivement un dossier
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

// 3️⃣ Copier les fichiers nécessaires
const toCopy = ["index.html", "lang.js", "image"];
toCopy.forEach(f => {
  if (fs.existsSync(f)) {
    console.log(`📦 Copie de ${f}...`);
    copyRecursive(f, path.join(dist, f));
  } else {
    console.warn(`⚠️ Fichier introuvable : ${f}`);
  }
});

// 4️⃣ Minification JS
if (fs.existsSync("script.js")) {
  console.log("🔧 Minification JS...");
  execSync(`npx terser script.js -o ${dist}/script.min.js --compress drop_console=true,drop_debugger=true --mangle`, { stdio: "inherit" });
}

// 5️⃣ Minification CSS
if (fs.existsSync("style.css")) {
  console.log("🎨 Minification CSS...");
  execSync(`npx cleancss -o ${dist}/style.min.css style.css`, { stdio: "inherit" });
}

console.log("\n✅ Build terminée ! Les fichiers minifiés sont dans le dossier 'build/'.");

// === Mise à jour du index.html pour utiliser les fichiers minifiés ===
const indexPath = path.join(dist, "index.html");
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, "utf-8");

  // remplace les liens vers les fichiers non minifiés
  html = html
    .replace(/style\.css/g, "style.min.css")
    .replace(/script\.js/g, "script.min.js");

  fs.writeFileSync(indexPath, html, "utf-8");
  console.log("🔗 index.html mis à jour pour utiliser les fichiers minifiés.");
}