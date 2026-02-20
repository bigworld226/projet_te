const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const REMOTE_APP_URL = process.env.DESKTOP_TARGET_URL || "https://travel-express-main.vercel.app";
const APP_URL = "http://127.0.0.1:3000";
const WEB_PORT = "3000";
let nextProcess = null;
let mainWindow = null;
let embeddedServerStarted = false;

function pingServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.destroy();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await pingServer(url)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function startNextDevServer() {
  const projectDir = path.join(__dirname, "..");
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  nextProcess = spawn(npmCmd, ["run", "dev", "--", "-p", WEB_PORT], {
    cwd: projectDir,
    shell: true,
    stdio: "inherit",
  });

  nextProcess.on("close", () => {
    nextProcess = null;
  });
}

function startNextProdServer() {
  if (embeddedServerStarted) return;
  embeddedServerStarted = true;

  const projectDir = path.join(__dirname, "..");
  const serverEntry = path.join(projectDir, ".next", "standalone", "server.js");

  process.env.NODE_ENV = "production";
  process.env.NEXT_TELEMETRY_DISABLED = "1";
  process.env.PORT = WEB_PORT;
  process.env.HOSTNAME = "127.0.0.1";
  process.env.ELECTRON_RUN_AS_NODE = "1";

  try {
    require(serverEntry);
  } catch (err) {
    embeddedServerStarted = false;
    throw err;
  }
}

async function ensureServerRunning() {
  if (app.isPackaged) return;

  const alreadyUp = await pingServer(APP_URL);
  if (alreadyUp) return;

  startNextDevServer();

  const ready = await waitForServer(APP_URL);
  if (!ready) {
    throw new Error("Le serveur Next.js n'a pas démarré à temps.");
  }
}

function createMainWindow() {
  const iconPath = process.platform === "win32"
    ? path.resolve(__dirname, "icon.ico")
    : path.resolve(__dirname, "icon.png");
  const win = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    title: "Travel Express",
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const splashHtml = encodeURIComponent(`
    <html>
      <body style="margin:0;font-family:Segoe UI,Arial,sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="text-align:center">
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">Travel Express</div>
          <div style="opacity:.8">Chargement en cours...</div>
        </div>
      </body>
    </html>
  `);
  win.loadURL(`data:text/html;charset=utf-8,${splashHtml}`);
  return win;
}

app.whenReady().then(async () => {
  mainWindow = createMainWindow();
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (app.isPackaged) {
        mainWindow.loadURL(REMOTE_APP_URL);
      } else {
        await ensureServerRunning();
        mainWindow.loadURL(APP_URL);
      }
    }
  } catch (err) {
    console.error("Erreur Electron:", err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      const errorHtml = encodeURIComponent(`
        <html>
          <body style="margin:0;font-family:Segoe UI,Arial,sans-serif;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;padding:24px;">
            <div style="max-width:700px">
              <h2 style="margin:0 0 10px 0">Erreur de démarrage</h2>
              <p style="opacity:.85">Le serveur interne n'a pas démarré correctement.</p>
              <pre style="white-space:pre-wrap;background:#1f2937;padding:12px;border-radius:8px;">${String(err)}</pre>
            </div>
          </body>
        </html>
      `);
      mainWindow.loadURL(`data:text/html;charset=utf-8,${errorHtml}`);
    }
  }
});

app.on("window-all-closed", () => {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
});
