# 🧪 Manual Testing Guide - AI-Enhanced Attendance System

## 📋 Quick Summary of What Was Built

### ✨ 5 Main Features Added

1. **ML Model Training** - Random Forest classifier (86% accuracy)
2. **ML Prediction API** - Predict worker behavior category
3. **AI Insights API** - Generate intelligent reports (Grok/OpenAI/Gemini)
4. **ML Predictions Component** - React UI showing predictions
5. **AI Insights Component** - React UI showing AI reports

---

## 🚀 SETUP (Do This First!)

### Step 1: Install Python Dependencies
```bash
cd ML
python -m venv venv
Windows: venv\Scripts\activate        # mac: source venv/bin/activate  
pip install -r requirements.txt
```

### Step 2: Generate Synthetic Data & Train Model
```bash
python generate_synthetic_data.py
# Output: data/synthetic_attendance_data.csv (1000 rows)

python train_model.py
# Output: models/random_forest_model.pkl (~2MB)
# Should show: Accuracy ≈ 86-87%
```

### Step 3: Setup Backend Environment
```bash
cd backend
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
AI_PROVIDER=grok
AI_API_KEY=your_grok_api_key
PORT=5000
EOF
```

**Get Grok API Key:** https://console.x.ai (free tier available)

### Step 4: Start Backend
```bash
cd backend
npm install
npm run dev
# Should show: 🚀 BlueTrack Backend running on http://localhost:5000
```

### Step 5: Start Frontend (New Terminal)
```bash
cd frontend
npm install
npm run dev
# Should show: ➜ Local: http://localhost:5050/
```

---

## 🧪 TESTING EACH FEATURE

### FEATURE 1️⃣: ML Model Training

**What It Does:** Trains a Random Forest model to predict worker categories (Regular/Irregular/High_Risk)

**Files:**
- `ML/train_model.py` - Main training script
- `ML/generate_synthetic_data.py` - Creates fake attendance data

**How to Test:**
```bash
cd ML

# 1. Generate data
python generate_synthetic_data.py
ls data/synthetic_attendance_data.csv  # Should exist

# 2. Train model
python train_model.py

# Expected output:
# Training Accuracy: ~87.5%
# Testing Accuracy: ~86.2%
# Model saved: models/random_forest_model.pkl

# 3. Check model file exists
ls models/random_forest_model.pkl  # Should exist (~2MB)

# 4. View Jupyter notebook (optional)
jupyter notebook notebooks/worker_attendance_prediction.ipynb
```

**✅ Success Criteria:**
- Model file created at `models/random_forest_model.pkl`
- Accuracy ≥ 85%
- No Python errors

---

### FEATURE 2️⃣: ML Prediction API (Backend)

**What It Does:** 
- Endpoint 1: `POST /api/ml/predict` - Raw prediction
- Endpoint 2: `GET /api/ml/worker/:workerId/prediction` - Worker-specific
- Endpoint 3: `POST /api/ml/batch-predict` - Multiple workers

**Files:**
- `backend/controllers/mlController.js` - Prediction logic
- `backend/routes/mlRoutes.js` - API routes
- `backend/ML/predict.py` - Python model inference

**How to Test:**

**Test 1: Raw Prediction**
```bash
curl -X POST http://localhost:5000/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{
    "is_late": 0,
    "absences_30d": 2,
    "attendance_rate": 95.0,
    "overtime_hours": 2.5,
    "total_hours_worked": 8.0,
    "day_of_week": 2,
    "check_in_hour": 7,
    "check_out_hour": 16,
    "shift_type_encoded": 2,
    "is_present": 1
  }'

# Expected response:
# {
#   "prediction": "Regular",
#   "confidence": 0.92,
#   "probabilities": {
#     "Regular": 0.92,
#     "Irregular": 0.06,
#     "High_Risk": 0.02
#   }
# }
```

**Test 2: Worker-Specific Prediction (requires worker in DB)**
```bash
curl http://localhost:5000/api/ml/worker/W001/prediction

# Expected response:
# {
#   "worker_id": "W001",
#   "prediction": "Regular",
#   "confidence": 0.88,
#   "stats": {
#     "total_days": 20,
#     "present_days": 18,
#     "absent_days": 2
#   }
# }
```

**Test 3: Batch Prediction**
```bash
curl -X POST http://localhost:5000/api/ml/batch-predict \
  -H "Content-Type: application/json" \
  -d '{
    "workers_data": [
      {"is_late": 0, "absences_30d": 1, "attendance_rate": 96, "overtime_hours": 1, "total_hours_worked": 8, "day_of_week": 2, "check_in_hour": 7, "check_out_hour": 16, "shift_type_encoded": 2, "is_present": 1},
      {"is_late": 1, "absences_30d": 5, "attendance_rate": 80, "overtime_hours": 0, "total_hours_worked": 6, "day_of_week": 2, "check_in_hour": 9, "check_out_hour": 15, "shift_type_encoded": 1, "is_present": 1}
    ]
  }'

# Expected: Array of predictions for both workers
```

**✅ Success Criteria:**
- All 3 endpoints return HTTP 200
- Predictions are one of: "Regular", "Irregular", "High_Risk"
- Confidence score between 0 and 1
- Response time < 100ms

---

### FEATURE 3️⃣: AI Insights API (Backend)

**What It Does:**
- Generates intelligent reports from attendance data
- Powered by Grok/OpenAI/Gemini (whichever API you configure)
- Endpoint 1: `POST /api/ai/generate-insights` - Custom insights
- Endpoint 2: `GET /api/ai/contractor/:contractorId/insights` - Contractor summary

**Files:**
- `backend/controllers/aiController.js` - Insight generation
- `backend/routes/aiRoutes.js` - API routes

**Prerequisites:** 
- Set `AI_PROVIDER` and `AI_API_KEY` in `.env`

**How to Test:**

**Test 1: Generate Insights (with worker filter)**
```bash
curl -X POST http://localhost:5000/api/ai/generate-insights \
  -H "Content-Type: application/json" \
  -d '{
    "contractor_id": 101,
    "worker_ids": ["W001", "W002"],
    "period": "weekly"
  }'

# Expected response:
# {
#   "insights": "Based on attendance data for workers W001, W002 during the week...",
#   "top_performers": ["W001"],
#   "concerns": ["W002"],
#   "recommendations": [...]
# }
```

**Test 2: Contractor-Wide Insights**
```bash
curl "http://localhost:5000/api/ai/contractor/101/insights?period=weekly"

# Expected response:
# {
#   "summary": "Weekly attendance summary for contractor 101...",
#   "top_performers": ["W001", "W003"],
#   "needs_attention": ["W002"],
#   "data_points": {
#     "total_workers": 10,
#     "average_attendance": 92.5,
#     "absent_today": 2
#   },
#   "recommendations": [...]
# }
```

**✅ Success Criteria:**
- HTTP 200 response
- `insights` field contains readable text
- `top_performers` and `concerns` are arrays
- No API errors in backend console

---

### FEATURE 4️⃣: ML Predictions React Component

**What It Does:** Beautiful UI table showing worker predictions with risk levels

**Files:**
- `frontend/src/components/MLPredictions.jsx` - Component logic
- `frontend/src/components/MLPredictions.css` - Styling

**How to Test:**

1. **Add to Dashboard** - Edit `frontend/src/pages/DashboardPage/DashboardPage.jsx`:
```jsx
import MLPredictions from '../../components/MLPredictions';

export default function DashboardPage() {
  return (
    <div>
      {/* Existing dashboard code */}
      
      {/* Add this */}
      <MLPredictions contractorId={101} />
    </div>
  );
}
```

2. **Navigate to Dashboard** - Go to `http://localhost:5050/dashboard`

3. **Verify UI Shows:**
   - ✅ Table with worker predictions
   - ✅ Green badges for "Low Risk"
   - ✅ Yellow badges for "Medium Risk"
   - ✅ Red badges for "High Risk"
   - ✅ Confidence scores (0-100%)
   - ✅ "Refresh" button works
   - ✅ Filter dropdown by risk level works
   - ✅ Mobile responsive (resize browser)

**✅ Success Criteria:**
- Component renders without errors
- Shows list of workers with predictions
- Color coding works (green/yellow/red)
- Responsive on mobile

---

### FEATURE 5️⃣: AI Insights React Component

**What It Does:** Beautiful UI panels showing AI-generated insights with multiple tabs

**Files:**
- `frontend/src/components/AIInsights.jsx` - Component logic
- `frontend/src/components/AIInsights.css` - Styling

**How to Test:**

1. **Add to Dashboard** - Edit `frontend/src/pages/DashboardPage/DashboardPage.jsx`:
```jsx
import AIInsights from '../../components/AIInsights';

export default function DashboardPage() {
  return (
    <div>
      {/* Existing code */}
      
      {/* Add this */}
      <AIInsights contractorId={101} period="weekly" />
    </div>
  );
}
```

2. **Navigate to Dashboard** - Go to `http://localhost:5050/dashboard`

3. **Verify UI Shows:**
   - ✅ Statistics cards (Total Workers, Avg Attendance, etc.)
   - ✅ 4 tabs: Overview | Top Performers | Needs Attention | Recommendations
   - ✅ Tab switching works
   - ✅ AI-generated text displays
   - ✅ Refresh button works
   - ✅ Gradient background styling looks good
   - ✅ Mobile responsive (resize browser)

**✅ Success Criteria:**
- Component renders without errors
- All tabs clickable and show content
- AI insights text is readable
- Mobile responsive design works

---

## 🔄 FULL END-TO-END TEST

**Scenario:** Mark attendance, then check ML predictions and AI insights

### Steps:

1. **Login to Dashboard**
   - Phone: `9999999999`
   - Password: `admin123`

2. **Mark Attendance** (existing feature, ensure it works)
   - Go to "Mark Attendance" page
   - Click "Present" for a worker
   - Click "Submit All"
   - Verify data saved in database

3. **View ML Predictions**
   - Go to Dashboard
   - Scroll to MLPredictions component
   - Verify worker shows up with prediction
   - Click "Refresh" button
   - Check console for any errors

4. **View AI Insights**
   - Scroll to AIInsights component
   - See AI-generated insights text
   - Switch between tabs
   - Click refresh
   - Check console for any errors

5. **Check Backend Logs**
   - Watch backend console (terminal)
   - Should show API requests logged
   - No errors should appear
   - Response times < 100ms for ML, < 2s for AI

---

## 📝 TEST RESULTS TEMPLATE (for test.md)

```markdown
# TEST RESULTS

## Environment Setup ✅/❌
- [ ] Python venv created
- [ ] ML dependencies installed
- [ ] Backend .env configured
- [ ] Frontend .env configured

## ML Model Training ✅/❌
- [ ] Synthetic data generated (1000 rows)
- [ ] Model trained successfully
- [ ] Accuracy ≥ 85%
- [ ] Model file created

## ML Prediction API ✅/❌
- [ ] POST /api/ml/predict works
- [ ] GET /api/ml/worker/:workerId/prediction works
- [ ] POST /api/ml/batch-predict works
- [ ] Response time < 100ms

## AI Insights API ✅/❌
- [ ] POST /api/ai/generate-insights works
- [ ] GET /api/ai/contractor/:contractorId/insights works
- [ ] AI text generated successfully
- [ ] Response time < 2s

## Frontend Components ✅/❌
- [ ] MLPredictions component renders
- [ ] AIInsights component renders
- [ ] Both responsive on mobile
- [ ] No console errors

## End-to-End ✅/❌
- [ ] Can mark attendance
- [ ] ML predictions appear after marking
- [ ] AI insights display on dashboard
- [ ] All features working together

## Issues Found
(List any bugs or problems)

## Notes
(Any observations or suggestions)
```

---

## 🎯 Testing Order

1. **First:** ML Model Training (offline, no API needed)
2. **Second:** Backend APIs (curl commands, no frontend)
3. **Third:** Frontend Components (integrate into Dashboard)
4. **Fourth:** Full End-to-End Test (mark attendance → see predictions → see insights)

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not found | Run `python train_model.py` in ML folder |
| API returns 500 | Check backend console logs |
| AI returns empty | Check AI_API_KEY in .env is valid |
| Component not rendering | Check browser console for React errors |
| CORS error | Ensure frontend VITE_API_URL matches backend PORT |
| Python not found | Ensure venv is activated |
| No workers in DB | Add workers via "Worker Management" page first |

---

**Ready to test? Start with Setup, then go through each feature in order!** 🚀
