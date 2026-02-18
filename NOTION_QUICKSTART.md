# Notion Integration - Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Create Notion Integration (2 min)

1. **Go to:** https://www.notion.so/my-integrations
2. **Click:** "+ New integration"
3. **Name:** `MasterLinc Bridge`
4. **Copy:** The integration token (starts with `ntn_`)

### Step 2: Share Your Databases (1 min)

For **each** of your 9 databases:
1. Open the database page
2. Click **"..."** (top right)
3. Click **"Connections"** 
4. Add **"MasterLinc Bridge"**

### Step 3: Configure & Start (2 min)

```bash
cd /Users/fadil369/masterlinc_clone

# Create local config (gitignored)
cp services/notion-bridge/.env.example services/notion-bridge/.env

# Edit and paste your token
nano services/notion-bridge/.env
# Set: NOTION_TOKEN=ntn_YOUR_TOKEN_HERE

# Start everything
./scripts/run-all.sh
```

### Step 4: Open Dashboard

**Go to:** http://localhost:5173

**Click:** "Notion Workspace" in the navigation

---

## ✅ What You Get

### 📊 Live Dashboards

- **Overview:** Auto-discovered databases + connection stats
- **Today:** Today's appointments with one-click status updates
- **Patients:** Active patients gallery (syncs with FHIR)
- **Tasks:** Task management with priority/due date tracking
- **Billing:** Invoice tracking by status

### 🔄 Read/Write Operations

All status updates in the UI **write back to Notion** immediately:
- Mark appointments as "In Progress" or "Completed"
- Update task status (To Do → In Progress → Done)
- Change patient status
- Track billing status changes

### 🔗 FHIR ↔ Notion Sync (Optional)

**Enable by adding to `.env`:**
```env
FHIR_URL=http://localhost:3101
NOTION_PATIENTS_DB_ID=abc123...  # Get from Overview tab after first run
```

**Manual sync:**
```bash
curl -X POST http://localhost:7400/api/sync/fhir-to-notion
```

---

## 🗂️ Your 9 Databases

Make sure these databases are shared with the integration:

1. ✅ **Patients** - Auto-mapped if title contains "patient"
2. ✅ **Appointments** - Auto-mapped if title contains "appointment"
3. ✅ **Team Members**
4. ✅ **Medical Records**
5. ✅ **Prescriptions**
6. ✅ **Lab Results**
7. ✅ **Billing** - Auto-mapped if title contains "billing" or "invoice"
8. ✅ **Tasks** - Auto-mapped if title contains "task"
9. ✅ **Clinical Templates**

---

## 🔐 Security Note

**You shared a real token in chat.** You should rotate it:

1. Go to: https://www.notion.so/my-integrations
2. Click "MasterLinc Bridge"
3. Click **"Regenerate"** under token
4. Update `.env` with new token
5. Restart: `docker-compose restart notion-bridge`

---

## 📖 Full Documentation

See [docs/NOTION_INTEGRATION.md](./docs/NOTION_INTEGRATION.md) for:
- API reference
- Database schema requirements
- Troubleshooting
- Advanced sync options

---

## 🎯 URLs After Start

- **Healthcare UI:** http://localhost:5173
- **Notion Bridge API:** http://localhost:7400/health
- **FHIR Server:** http://localhost:3101/health

---

**Need help?** Check the Overview tab in Notion Workspace for live connection status.
