# TypeShelf

TypeShelf is a self-hosted font library manager that lets you organize, preview, and manage your font collections locally.

It’s designed to run easily on Umbrel, Docker, or any Node.js environment.

---

## ✨ Features

- 📂 Organize fonts into categories & collections  
- 🔍 Preview font families instantly  
- 📁 Scan folders automatically  
- 🏠 Fully self-hosted (your data stays with you)  
- ⚡ Works great on Umbrel

---

# 🚀 Running on Umbrel (Recommended)

TypeShelf runs as a custom Umbrel app using your community app store.

### 1. Add your App Store
In Umbrel UI:
- App Store → ⋯ → Community App Stores  
- Add your repo:
https://github.com/hashmoody/umbrel-app-store

---

### 2. Install TypeShelf
- Open your custom store
- Click TypeShelf → Install

---

# 📁 How to Add Fonts (IMPORTANT)

Because TypeShelf runs inside Docker, you must use container paths, not your system paths.

---

## ✅ Option 1 (Recommended): Use your existing font folder

Your host folder is mounted as:

/host-fonts

### Example:
If your fonts are here on Umbrel:
/home/umbrel/umbrel/home/Installers/Fonts/SansSerif

Then inside TypeShelf, add folder:

/host-fonts/SansSerif

✔ No copying needed  
✔ Changes reflect instantly  
✔ Safe (read-only)

---

## ✅ Option 2: Let TypeShelf manage fonts

TypeShelf has its own persistent storage:

/app/fonts

### To use:
1. Copy fonts into:
~/umbrel/app-data/athena-typeshelf/fonts/

2. Add folder in UI:
/app/fonts/YourFolder

---

## 🧠 Rule of thumb

| What you want | Use this path |
|--------------|-------------|
Use existing system fonts | /host-fonts/... |
Let TypeShelf store fonts | /app/fonts/... |

---

# 💾 Data Persistence

TypeShelf stores data in:

- Fonts → ${APP_DATA_DIR}/fonts
- App data → ${APP_DATA_DIR}/data

So:
✔ Restart → safe  
✔ Update → safe  
✔ Reinstall (keep data) → safe  

---

# ⚠️ Common Issues & Fixes

---

## ❌ Fonts disappear after restart
### Fix:
Ensure this volume exists in your app:

yaml - ${APP_DATA_DIR}/data:/app/data 

---

## ❌ App crashes with ENOSPC
This means too many file watchers.

### Fix (recommended):
Run on Umbrel:

bash sudo tee /etc/sysctl.d/99-typeshelf-inotify.conf >/dev/null <<'EOF' fs.inotify.max_user_watches=2097152 fs.inotify.max_user_instances=4096 fs.inotify.max_queued_events=1048576 EOF  sudo sysctl --system 

---

## ❌ App not starting after install
Check logs:

bash sudo docker logs athena-typeshelf_server_1 

---

## ❌ Install button does nothing
Usually caused by:
- Wrong image tag
- Invalid docker-compose.yml

Fix:
- Use :latest or valid version tag
- Ensure YAML has no duplicate keys

---

# 🛠 Development (Local)

bash npm install npm run dev 

Build:
bash npm run build npm start 

---

# 🧩 Tech Stack

- Node.js + Express  
- React  
- Drizzle ORM  
- Chokidar (file watching)

---

# 🔮 Roadmap

- Postgres-backed storage (replace JSON)
- Smarter font indexing
- Tagging & search improvements
- Sync across devices

---

# 🤝 Contributing

PRs welcome!  
If you find bugs or want features, open an issue.

---

# 📄 License

MIT

---

## Built with ❤️ by Azoora
