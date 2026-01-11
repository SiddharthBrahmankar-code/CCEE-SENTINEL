# CCEE Sentinel - Complete Setup Instructions for Antigravity

**Purpose:** Deploy and run CCEE exam prep app publicly on this laptop.

---

## STEP 1: Check Prerequisites

Run these commands to install required software:

```powershell
# Open PowerShell as Administrator and run:
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
winget install Git.Git --accept-package-agreements --accept-source-agreements  
winget install Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
```

Close PowerShell completely and reopen it to refresh paths.

Verify installations:
```powershell
node --version
# Should show: v20.x.x or higher

git --version
# Should show: git version 2.x.x

cloudflared --version
# Should show: cloudflared version 3.x.x
```

---

## STEP 2: Clone the Repository

```powershell
cd D:\
git clone https://github.com/SiddharthBrahmankar-code/CCEE-SENTINEL.git
cd CCEE-SENTINEL
```

---

## STEP 3: Install All Dependencies

```powershell
cd D:\CCEE-SENTINEL\client
npm install

cd D:\CCEE-SENTINEL\server
npm install
```

---

## STEP 4: Configure API Keys

Create the environment file:
```powershell
cd D:\CCEE-SENTINEL\server
copy .env.example .env
```

Open the .env file:
```powershell
notepad .env
```

Replace ALL placeholder values with real API keys. The file should look like:
```
PORT=4000
OPENROUTER_API_KEY=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
OPENROUTER_API_KEY_2=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
OPENROUTER_API_KEY_3=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
OPENROUTER_API_KEY_4=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
AI_API_KEY=9ff7b68b-aa52-4cb3-8540-4c10fe17daf2
GEMINI_API_KEY=AIzaSyA1OOi2ApaOfKNrx_ENhZ75j8I7x6CpaGA
GEMINI_API_KEY_2=AIzaSyB_u8nYAB9VmWOstK7p60lv_XHPh5Rb_o4
GEMINI_API_KEY_3=AIzaSyBEPsuP0N79mPgY-8EPXsyGNgr3TYbZPqo
GEMINI_API_KEY_4=AIzaSyAUXFXfw0vevX1kkeUISqfb4OgVJTc6gwo
GEMINI_API_KEY_5=AIzaSyCMgh5voRuU-eF2SIiF063CdWdSD6yS9pk
GEMINI_API_KEY_6=AIzaSyDH5ucWQhhZWVYNfIq3gnJL1tthjSucEpI
```

Save and close Notepad (Ctrl+S, then close).

---

## STEP 5: Copy Data Folder

The `data` folder is too large for GitHub. Copy it manually:

1. Get the `data` folder from USB drive or Google Drive link
2. Copy entire folder to: `D:\CCEE-SENTINEL\data\`

Verify structure:
```powershell
dir D:\CCEE-SENTINEL\data
```
Should show: `ccee`, `PYQ`, `sanfoundry`, `Syllabus` folders

---

## STEP 6: Build the Frontend

```powershell
cd D:\CCEE-SENTINEL\client
npm run build
```

Wait for message: `✓ built in X.XXs`

---

## STEP 7: Configure Server to Serve Frontend

The server needs to serve the built frontend. Check if this is already configured:

```powershell
notepad D:\CCEE-SENTINEL\server\src\index.ts
```

Make sure these lines exist near the end of the file (before `app.listen`):

```typescript
// Serve static frontend files
import path from 'path';
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  }
});
```

---

## STEP 8: Start the Server

```powershell
cd D:\CCEE-SENTINEL\server
npm start
```

Expected output:
```
🚀 Server running on port 4000
```

**KEEP THIS TERMINAL WINDOW OPEN!**

---

## STEP 9: Start Cloudflare Tunnel (Public Access)

Open a **NEW PowerShell window** (don't close the server terminal):

```powershell
cloudflared tunnel --url http://localhost:4000
```

Wait for output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://random-words-here.trycloudflare.com                                               |
+--------------------------------------------------------------------------------------------+
```

**Copy the https URL** - this is your public link! Share it with anyone.

---

## DAILY RESTART COMMANDS

After laptop restart, run these two commands in separate terminals:

**Terminal 1 - Server:**
```powershell
cd D:\CCEE-SENTINEL\server
npm start
```

**Terminal 2 - Tunnel:**
```powershell
cloudflared tunnel --url http://localhost:4000
```

---

## UPDATING THE CODE

When Siddharth pushes updates:

```powershell
cd D:\CCEE-SENTINEL
git pull
cd client
npm run build
cd ..\server
npm start
```

---

## TROUBLESHOOTING

**"npm: command not found"**
- Close all PowerShell windows
- Open new PowerShell
- Try again

**"Address already in use: 4000"**
```powershell
taskkill /F /IM node.exe
```
Then start server again.

**"Cannot find module"**
```powershell
cd D:\CCEE-SENTINEL\client && npm install
cd D:\CCEE-SENTINEL\server && npm install
```

**Tunnel fails to start**
- Check internet connection
- Try: `cloudflared update` then retry

**No questions loading**
- Ensure `data` folder is copied correctly
- Check that `data\ccee\` and `data\sanfoundry\` have JSON files
