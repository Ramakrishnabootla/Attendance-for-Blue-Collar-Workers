# Project Title
**AI-Enhanced Attendance Management System for Blue Collar Workers**

## Project Overview
This project is a complete working application designed to intelligently track and manage the attendance of blue-collar workers. It goes beyond simple check-in/check-out by integrating Machine Learning (to predict worker behavior and flight risk) and Generative AI (to provide actionable, concise insights for contractors). 

Features include:
- A Supervisor Dashboard to bulk-mark attendance and view statistics.
- A Worker Portal for transparency into their own shifts and notifications.
- Automated ML predictions for categorizing workers (e.g., "Regular Worker", "High Absence Risk").
- GenAI-driven 2-line performance insights tailored for specific contractors and workers.
- Automated background tasks, such as auto-checkout after 6 hours.

## Technologies Used
- **Frontend:** React.js (Vite), HTML, CSS, JavaScript, Recharts
- **Backend:** Node.js, Express.js (Controller-Service Architecture)
- **Database:** Supabase (PostgreSQL)
- **Machine Learning:** Python, scikit-learn, pandas, joblib (Random Forest Classifier)
- **Generative AI:** Groq API (LLaMA 3)

## Setup Instructions
Ensure you have the following installed on your system:
- Node.js (v18 or higher)
- Python (3.8 or higher)
- Git

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
*(Note: A pre-configured database is already execute the provided `setup.sql` in your own PostgreSQL instance).*

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
