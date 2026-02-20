const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source introuvable: ${src}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function main() {
  const root = path.resolve(__dirname, "..");
  const standaloneRoot = path.join(root, ".next", "standalone");
  const staticSrc = path.join(root, ".next", "static");
  const staticDest = path.join(standaloneRoot, ".next", "static");
  const publicSrc = path.join(root, "public");
  const publicDest = path.join(standaloneRoot, "public");

  copyDir(staticSrc, staticDest);
  copyDir(publicSrc, publicDest);

  console.log("Standalone prêt: .next/static + public copiés.");
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
