# Attendance for Blue Collar Workers

An AI-powered attendance management system designed specifically for 
blue-collar workers and supervisors. The system simplifies attendance
tracking, worker management, and provides intelligent insights using
Machine Learning and Generative AI.

------------------------------------------------------------------------
# Deployment Link : https://bluecollarworkers.vercel.app/
------------------------------------------------------------------------

## 📌 Project Overview

Attendance for Blue Collar Workers is a full-stack web application that
enables supervisors to efficiently manage workers and their attendance
while allowing workers to transparently view their attendance history
and status.

The application includes:

-   Supervisor and Worker authentication
-   Worker management (Add, Update, Activate, Deactivate)
-   Daily attendance marking
-   Bulk attendance support
-   Attendance history and analytics
-   Automatic checkout after 6 hours
-   Machine Learning based worker categorization
-   Generative AI based worker and contractor insights
-   Notifications for workers

------------------------------------------------------------------------

## ✨ Features

### Supervisor Features

-   Secure login
-   Add new workers
-   Update worker details
-   Activate / Deactivate workers
-   Mark attendance individually
-   Bulk attendance marking
-   View attendance history
-   View attendance analytics
-   View contractor-wise reports
-   Generate AI-powered insights

### Worker Features

-   Secure login using Worker ID + PIN/Phone
-   View attendance records
-   View notifications
-   View attendance statistics
-   Check attendance status

### AI Features

-   Worker performance insights
-   Contractor performance analysis
-   Attendance trend analysis
-   AI-generated recommendations

### Machine Learning Features

-   Worker categorization using Random Forest
-   Attendance pattern analysis
-   Batch predictions
-   Store prediction history

------------------------------------------------------------------------

## 🏗️ Project Architecture

``` text
Frontend (React)
↓
Backend API (Node.js + Express)
↓
Supabase PostgreSQL Database
↓
Python ML Service (Random Forest)
↓
GenAI Service (Groq / Gemini / OpenAI)
```

------------------------------------------------------------------------
## Technologies Used
- **Frontend:** React.js (Vite), HTML, CSS, JavaScript, Recharts
- **Backend:** Node.js, Express.js (Controller-Service Architecture)
- **Database:** Supabase (PostgreSQL)
- **Machine Learning:** Python, scikit-learn, pandas, joblib (Random Forest Classifier)
- **Generative AI:** Groq API (LLaMA 3)

------------------------------------------------------------------------

## 📂 Project Structure

``` bash
Attendance-for-Blue-Collar-Workers
├── frontend/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── config/
│   └── index.js
├── ML/
├── setup.sql
└── README.md
```

------------------------------------------------------------------------

## ⚙️ Prerequisites

-   Node.js (v18 or later)
-   npm
-   Python 3.10+
-   pip
-   Supabase account

------------------------------------------------------------------------

## 🗄️ Database Setup

1.  Create a Supabase project.
2.  Copy the project URL and API key.
3.  Execute `setup.sql` in the Supabase SQL editor.

This creates: - supervisors - workers - attendance - notifications -
ml_predictions

------------------------------------------------------------------------

## 🔑 Environment Variables

Create `.env` inside backend:

``` env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

------------------------------------------------------------------------

## Steps to run the Backend
1. Open a terminal and navigate to the `Backend` folder:
   ```bash
   cd Backend
   ```
2. Install the required Node.js dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file (see the GenAI/API Key and Database setup sections below).
4. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend will start running on `http://localhost:5000` (or your configured port).

## Steps to run the Frontend
1. Open a new terminal and navigate to the `Frontend` folder:
   ```bash
   cd Frontend
   ```
2. Install the required Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. Open the provided local URL (usually `http://localhost:5050`) in your web browser.


## Database Setup Details
This project uses Supabase (PostgreSQL) as its database.
1. Create a `.env` file in the `Backend` directory.
2. Add your Supabase connection strings:
   ```env
   SUPABASE_URL=https://yqpphruslmmmurwluqwr.supabase.co
   SUPABASE_KEY=your_supabase_service_role_key
   ```
<<<<<<< HEAD
*(Note: A pre-configured database is already attached execute the provided `setup.sql` in your own PostgreSQL instance).*
=======
*(Note: A pre-configured database is already execute the provided `setup.sql` in your own PostgreSQL instance).*
>>>>>>> ca5771aef74f6a816ec1253caeaaf079d5a59576

## ML Model Details
The Machine Learning module uses a **Random Forest Classifier** to predict worker attendance behavior.
- **Location:** The code is located in the `ML` directory.
- **Dataset:** Synthetic attendance data is generated using `ML/src/generate_synthetic_data.py`.
- **Training:** The model is trained using `ML/src/train_model.py` and saved as `random_forest_model.pkl` in `ML/models/`.
- **Integration:** The Node.js backend calls the `ML/src/predict.py` script via a child process to get real-time predictions for the workers.

## GenAI/API Key Instructions
The Generative AI module uses the **Groq API** to generate insights.
1. Obtain an API key from Groq.
2. Add the API key to your `Backend/.env` file:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
   The backend `aiService.js` automatically uses this key to authenticate with the Groq LLaMA model and return 2-line performance insights on the frontend dashboard.

------------------------------------------------------------------------

## 🔮 Future Enhancements

-   Face Recognition attendance
-   QR Code attendance
-   Mobile app
-   Real-time notifications
-   Advanced analytics
-   Multi-language support

------------------------------------------------------------------------

## 👨‍💻 Author

**Ramakrishna Bootla**

GitHub: https://github.com/Ramakrishnabootla

------------------------------------------------------------------------

⭐ If you like this project, give it a Star on GitHub.
