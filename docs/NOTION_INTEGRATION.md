# Notion Integration Guide

## Overview

MasterLinc now has **full read/write integration** with Notion, turning your Notion workspace into a live "Doctor's Command Center" that syncs bidirectionally with the healthcare platform.

---

## Features

### 1. **Auto-Discovery**
- Automatically detects all Notion databases shared with the integration
- Auto-maps databases by title (Patients, Appointments, Tasks, Billing)
- Displays full schema (properties, types, relationships)

### 2. **Structured Dashboards**
Four purpose-built views in the Healthcare UI:

#### **Today's Schedule**
- Shows today's appointments from Notion
- Filter by status (Scheduled, In Progress, Completed, No Show)
- One-click status updates
- Sorted by time

#### **Patients View**
- Active patients gallery
- Filter: All / Active / Inactive
- Shows age, status, last visit
- Click to view FHIR details

#### **Tasks View**
- Task management with status workflow
- Priority indicators (High/Medium/Low)
- Due date tracking with overdue alerts
- Quick status transitions (To Do → In Progress → Done)

#### **Billing View**
- Invoice tracking by status (Pending/Paid/Overdue)
- Total amounts by filter
- Patient-linked billing records
- Integration with SBS claims

### 3. **FHIR ↔ Notion Sync**
Bidirectional patient data sync:

**FHIR → Notion:**
- Syncs FHIR Patient resources to Notion Patients database
- Maps: Name, Age, Phone, Email, Gender, Status
- Preserves FHIR ID for round-trip sync

**Notion → FHIR:**
- Updates FHIR server when Notion records change
- Creates new FHIR patients from Notion entries
- Maintains data consistency

---

## Setup

### Step 1: Create Notion Integration

1. Go to: https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Name: `MasterLinc Bridge`
4. Workspace: Select your workspace
5. Copy the **Internal Integration Token** (starts with `ntn_`)

### Step 2: Share Databases with Integration

For each database you want to sync:
1. Open the database in Notion
2. Click **"..."** (top right)
3. Click **"Connections"**
4. Add **"MasterLinc Bridge"**

Share these databases:
- ✅ Patients
- ✅ Appointments
- ✅ Tasks
- ✅ Billing
- ✅ Medical Records (optional)
- ✅ Prescriptions (optional)
- ✅ Lab Results (optional)

### Step 3: Configure MasterLinc

```bash
cd /Users/fadil369/masterlinc_clone
cp services/notion-bridge/.env.example services/notion-bridge/.env
nano services/notion-bridge/.env
```

Set these values:

```env
PORT=7400
NOTION_TOKEN=ntn_YOUR_TOKEN_HERE  # Paste your token from Step 1
NOTION_BRIDGE_API_KEY=            # Optional: add API key for security

# Optional: Enable FHIR sync
FHIR_URL=http://localhost:3101
NOTION_PATIENTS_DB_ID=            # Get from Notion URL after auto-discovery
```

### Step 4: Start the Stack

```bash
./scripts/run-all.sh
```

This starts:
- Docker services (FHIR, Payment, Audit, OID, DID)
- **notion-bridge** on port 7400
- SBS + BASMA workers
- Healthcare UI on http://localhost:5173

---

## Usage

### Access the Notion Dashboard

1. Open Healthcare UI: http://localhost:5173
2. Click **"Notion Workspace"** in the navigation
3. View auto-discovered databases in the **Overview** tab
4. Switch to **Today / Patients / Tasks / Billing** tabs

### Update Status (Write to Notion)

In **Today's Schedule**:
- Click status buttons (e.g., "In Progress", "Completed")
- Changes are written back to Notion immediately

In **Tasks View**:
- Click "In Progress" or "Done" to update task status
- Changes sync to Notion

### Sync FHIR Patients to Notion

**Manual sync (API call):**
```bash
curl -X POST http://localhost:7400/api/sync/fhir-to-notion
```

**Response:**
```json
{
  "synced": 42,
  "errors": 0
}
```

**Sync single Notion patient to FHIR:**
```bash
curl -X POST http://localhost:7400/api/sync/notion-to-fhir/{notion-page-id}
```

---

## API Reference

### Endpoints

#### `GET /health`
Health check

#### `GET /api/notion/databases/discover`
Auto-discover all databases with full schema

**Response:**
```json
{
  "databases": [
    {
      "id": "abc123...",
      "title": "Patients",
      "properties": { ... },
      "url": "https://notion.so/..."
    }
  ]
}
```

#### `POST /api/notion/query`
Query a database

**Payload:**
```json
{
  "databaseId": "abc123...",
  "filter": {
    "property": "Status",
    "status": { "equals": "Active" }
  },
  "sorts": [
    { "property": "Date", "direction": "descending" }
  ]
}
```

#### `POST /api/notion/page/create`
Create a new row/page in a database

#### `POST /api/notion/page/update`
Update properties of an existing page

#### `POST /api/notion/page/set-status`
Quick status update

**Payload:**
```json
{
  "pageId": "xyz789...",
  "statusProperty": "Status",
  "statusValue": "Completed"
}
```

---

## Database Schema Requirements

### Patients Database
Required properties:
- **Name** (Title)
- **Status** (Status): Active | Inactive
- **FHIR ID** (Text) - for sync
- **Age** (Number)
- **Phone** (Phone)
- **Email** (Email)

### Appointments Database
Required properties:
- **Date** (Date)
- **Time** (Date with time)
- **Patient** (Relation to Patients OR Text)
- **Status** (Status): Scheduled | In Progress | Completed | Cancelled | No Show
- **Type** (Select): Consultation | Follow-up | Emergency
- **Doctor** (Person)

### Tasks Database
Required properties:
- **Name** (Title)
- **Status** (Status): To Do | In Progress | Done
- **Priority** (Select): High | Medium | Low
- **Due Date** (Date)
- **Assignee** (Person)

### Billing Database
Required properties:
- **Patient** (Relation to Patients OR Text)
- **Amount** (Number)
- **Status** (Status): Pending | Paid | Overdue
- **Date** (Date)
- **Invoice Number** (Text)

---

## Security

### Token Rotation

**Immediately rotate your Notion token if:**
- You shared it in chat/email
- You committed it to git
- You suspect it was exposed

**To rotate:**
1. Go to: https://www.notion.so/my-integrations
2. Select "MasterLinc Bridge"
3. Click "Regenerate" under "Internal Integration Token"
4. Update `.env` file with new token
5. Restart: `docker-compose restart notion-bridge`

### API Key Protection

Add an API key to prevent unauthorized access:

```env
NOTION_BRIDGE_API_KEY=your-secure-random-key
```

Then include it in requests:
```bash
curl -H "X-API-Key: your-secure-random-key" \
  http://localhost:7400/api/notion/databases/discover
```

---

## Troubleshooting

### "Failed to discover databases"

**Cause:** Integration not shared with databases

**Fix:**
1. Open each database in Notion
2. Click "..." → "Connections"
3. Add "MasterLinc Bridge"

### "No patients/appointments database found"

**Cause:** Database title doesn't contain the keyword

**Fix:**
- Rename your database to include "Patients", "Appointments", "Tasks", or "Billing"
- OR manually set database IDs in the UI

### FHIR sync not working

**Cause:** Missing env vars or FHIR server not running

**Fix:**
1. Check `FHIR_URL` is set in `.env`
2. Verify FHIR server: `curl http://localhost:3101/health`
3. Check logs: `docker-compose logs notion-bridge`

---

## Next Steps

1. **Scheduled Sync:** Add a cron job or GitHub Action to sync FHIR → Notion daily
2. **Webhooks:** Use Notion webhooks (when available) for real-time bi-directional sync
3. **More Databases:** Add Medical Records, Prescriptions, Lab Results sync
4. **Dashboards:** Create custom Notion dashboard views and embed them in the UI

---

## Commit History

- `ee07ac5` - Initial Notion bridge + generic UI
- `d2a7259` - Auto-discovery + structured dashboards
- `[latest]` - FHIR ↔ Notion sync + full integration

---

**Questions?** Check the Healthcare UI → Notion Workspace → Overview tab for live connection status.
