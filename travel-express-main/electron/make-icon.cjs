const fs = require("fs");
const path = require("path");
const pngToIco = require("png-to-ico");

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const iconInElectron = path.join(__dirname, "icon.png");
  const iconInWorkspaceRoot = path.resolve(projectRoot, "..", "icon.png");
  const icoOutput = path.join(__dirname, "icon.ico");

  let sourcePng = null;
  if (fs.existsSync(iconInElectron)) {
    sourcePng = iconInElectron;
  } else if (fs.existsSync(iconInWorkspaceRoot)) {
    sourcePng = iconInWorkspaceRoot;
    fs.copyFileSync(iconInWorkspaceRoot, iconInElectron);
  } else {
    throw new Error("icon.png introuvable (ni dans electron/, ni à la racine projet_te).");
  }

  const buf = await pngToIco(sourcePng);
  fs.writeFileSync(icoOutput, buf);
  console.log(`ICO généré: ${icoOutput}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
