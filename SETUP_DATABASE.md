# 🔧 BlueTrack - Manual Database Setup

## Step 1: Update MySQL Password (if needed)

If your MySQL root user has a password, update `.env`:

```bash
# backend/.env
DB_USER=root
DB_PASSWORD=your_mysql_password
```

## Step 2: Run the SQL Setup File

Run the `setup.sql` file in MySQL to create the database, tables, and insert dummy data:

### Option A: Using Command Line

```bash
cd /path/to/BlueTrack
mysql -u root -p < setup.sql
```

Then enter your MySQL password when prompted.

### Option B: Using MySQL Workbench or GUI

1. Open MySQL Workbench or your favorite MySQL client
2. Open file: `setup.sql`
3. Execute the script (Ctrl+Shift+Enter or ⌘+Shift+Enter)

### Option C: Using MySQL CLI directly

```bash
mysql -u root -p
mysql> source /path/to/setup.sql;
```

## What the SQL Script Does

✅ Creates `bluetrack_db` database
✅ Creates 3 tables:
   - `supervisors` (with demo account: 9999999999 / admin123)
   - `workers` (with 8 pre-loaded workers)
   - `attendance` (for tracking daily check-in/check-out)

✅ Inserts:
   - 1 default supervisor account
   - 8 dummy workers (all job types)

## Step 3: Start the Backend

```bash
cd backend
npm install  # (if not done already)
npm run dev
```

You should see:
```
🚀 BlueTrack Backend running on http://localhost:5000
📝 Endpoints ready:
   POST   /api/login
   GET    /api/workers
   ...
```

## Step 4: Start the Frontend

```bash
cd frontend
npm install  # (if not done already)
npm run dev
```

Then open: **http://localhost:5050**

## ✅ Verify Setup

In MySQL, run these commands to verify:

```sql
USE bluetrack_db;
SELECT * FROM supervisors;     -- Should show 1 admin user
SELECT COUNT(*) FROM workers;  -- Should show 8 workers
SELECT COUNT(*) FROM attendance; -- Should show 0 (no records yet)
```

## 🚨 Troubleshooting

**Error: "Unknown database 'bluetrack_db'"**
→ Run `setup.sql` first

**Error: "Access denied for user 'root'"**
→ Update `DB_PASSWORD` in `.env` to match your MySQL password

**Error: "Cannot find module 'mysql2'"**
→ Run `npm install` in `/backend`

---

**Ready to go!** Now you can login with:
- **Phone:** 9999999999
- **Password:** admin123
