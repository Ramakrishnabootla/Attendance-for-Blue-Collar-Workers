# BlueTrack Machine Learning Module - Technical Documentation

This document provides a comprehensive deep dive into the Machine Learning (ML) subsystem, explaining how the worker attendance behavior prediction model is constructed, evaluated, serialized, and integrated into the Node.js + Express backend workflow.

---

## Technical Overview: How, What, and Where

### What
The Machine Learning module is a predictive classification engine built using **Python** and **Scikit-learn**. Its core role is to analyze a worker's historical presence, liveness, overtime, and shift-adherence patterns to predict their attendance reliability category:
1. **Regular Worker**: High attendance rate, consistent shift schedules, low absences, and minimal lateness.
2. **Irregular Attendance**: Fluctuating schedules, occasional tardiness, moderate absence rates.
3. **High Absence Risk**: Critical absence metrics, recurring shifts skipped, low overall hours worked.

### How
* **Scikit-learn's Random Forest Classifier** is selected for its high resistance to overfitting, balanced class handling capabilities, and ability to yield measurable feature importances.
* **Child process streaming (IPC via standard I/O)** connects the Express backend to the Python script. The backend gathers raw Supabase attendance records, aggregates statistics in memory, streams the JSON payload directly into Python's `stdin`, parses predictions from `stdout`, and implements a rules-based fallback engine to guarantee maximum system availability.
* **A local virtual environment (`venv`)** isolates dependencies (numpy, pandas, scikit-learn, joblib) to prevent conflict with globally installed system versions.

### Where
All machine learning operations, assets, and serialized models are located in the `/ML` directory:
* **Training Pipeline Script**: `ML/train_model.py`
* **Real-time Scoring CLI**: `ML/predict.py`
* **Synthetic Dataset Generator**: `ML/generate_synthetic_data.py`
* **Serialized Model Binary**: `ML/models/random_forest_model.pkl`
* **Evaluation Chart Outputs**: `ML/models/model_evaluation.png`
* **Dataset Directory**: `ML/data/synthetic_attendance_data.csv`
* **Local Virtual Environment**: `ML/venv/`

---

## Machine Learning Directory Structure

```
ML/
├── data/
│   └── synthetic_attendance_data.csv # 1,000+ attendance histories
├── models/
│   ├── model_evaluation.png          # Visualizations of model results
│   └── random_forest_model.pkl       # Saved Random Forest joblib binary
├── notebooks/
│   └── attendance_prediction.ipynb   # Interactive analysis notebook
├── venv/                             # Local Python 3.10 virtual environment
├── generate_synthetic_data.py        # Dataset simulator script
├── predict.py                        # Live JSON-stream predictor
├── requirements.txt                  # Python dependencies declaration
├── testresults.md                    # Record of successful test runs
└── train_model.py                    # Main trainer & evaluator script
```

---

## Dataset & Feature Engineering

The model is trained on simulated workforce datasets that mimic multi-industry manual labor registers.

### 1. Raw Dataset Columns
* `date`: Calendar date.
* `worker_id`: Alphanumeric reference (e.g., `W002`).
* `name`: Worker's full name.
* `job_type`: Sector assigned (Factory, Construction, Packaging, Warehouse).
* `contractor_name`: Associated employer group.
* `check_in`: Realized check-in time (HH:MM).
* `check_out`: Realized check-out time (HH:MM).
* `shift_type`: Mapped shift (Morning, Evening, Night, General).
* `worker_category`: Target label (`Regular`, `Irregular`, `High_Risk`).

### 2. The Feature Preprocessing Pipeline
To feed the Random Forest algorithm, raw inputs are encoded and processed through an engineering pipeline:

| Feature Name | Type | Value Range | Derivation Logic |
| :--- | :--- | :--- | :--- |
| **`is_late`** | Integer | `0` or `1` | Set to `1` if the check-in time is later than standard shift starts (e.g., check-in hour $\ge 9$). |
| **`absences_30d`** | Integer | $\ge 0$ | Total number of skipped shifts (absent status records) within the trailing 30 calendar days. |
| **`attendance_rate`**| Float | `0.0` to `100.0`| Percentage of assigned shifts where the worker checked in successfully over their history. |
| **`overtime_hours`** | Float | $\ge 0.0$ | Cumulative or average overtime hours completed exceeding standard shift hours. |
| **`total_hours_worked`**| Float | $\ge 0.0$ | Total aggregated hours worked inside the target period. |
| **`day_of_week`** | Integer | `0` to `6` | Integer day index extracted from the record date (Monday = 0, Sunday = 6). |
| **`check_in_hour`** | Integer | `0` to `23` | Integer hour component extracted from the `check_in` time string. |
| **`check_out_hour`** | Integer | `0` to `23` | Integer hour component extracted from the `check_out` time string. |
| **`shift_type_encoded`**| Integer | `0` to `3` | Label Encoded string matching of shift type category. |
| **`is_present`** | Integer | `0` or `1` | Set to `1` if check_in exists for that date, otherwise `0`. |

---

## Model Hyperparameters & Training

### 1. Random Forest Configuration
The model uses `RandomForestClassifier` configured to handle imbalanced datasets, prevent overfitting, and output confident classification probabilities:

```python
model = RandomForestClassifier(
    n_estimators=100,         # Total decision trees in ensemble
    max_depth=15,             # Restricts maximum splits to prevent leaf overfitting
    min_samples_split=5,      # Minimum samples required to split an internal node
    min_samples_leaf=2,       # Minimum samples required to form a leaf node
    class_weight='balanced',  # Corrects class imbalance by adjusting weights
    n_jobs=-1,                # Parallel processing utilizing all available CPU cores
    random_state=42           # Sets random seed for reproducibility
)
```

### 2. Training Results & Metrics
* **Dataset Splitting**: 80/20 train-test split stratified on target labels.
* **Accuracy Achievements**:
  * **Training Set Accuracy**: `100.00%`
  * **Testing Set Accuracy**: `100.00%`
* **Precision / Recall Scorecard**:
  * `Regular` Class: `1.00` Precision, `1.00` Recall
  * `Irregular` Class: `1.00` Precision, `1.00` Recall
  * `High_Risk` Class: `1.00` Precision, `1.00` Recall

### 3. Feature Importance Ranking
The classifier ranks engineered features in order of their split contribution:
1. `attendance_rate` (Highest contribution)
2. `absences_30d`
3. `total_hours_worked`
4. `is_present`
5. `overtime_hours`
6. `check_out_hour`
7. `check_in_hour`
8. `day_of_week`
9. `shift_type_encoded`
10. `is_late` (Lowest contribution)

---

## Model Serializer & Output Visualization

### 1. Joblib Serialization
After training, the model is serialized into a standalone joblib binary using `joblib.dump(model, 'models/random_forest_model.pkl')`. This ensures that prediction scripts can load the classification state in milliseconds without retraining.

### 2. Visualization Dashboard
`train_model.py` generates a comprehensive diagnostic image at `models/model_evaluation.png` containing:
* **Top 10 Feature Importance Horizontal Bar Chart**: Visually indicates classification split weight.
* **Heatmap Confusion Matrix**: Proves that predictions perfectly map target labels.
* **Prediction Distribution Bar Chart**: Displays frequency counts of classified workers.
* **Performance Metadata Box**: Lists hyperparameters and validation scores.

---

## Parent-Child Integration: Node & Python IPC

To run predictions in real-time, the Node.js backend spawns the Python virtual environment interpreter as a subprocess and establishes standard stream communication.

```
+------------------+             JSON over stdin              +--------------------+
|  Node.js Backend | ---------------------------------------> | Python Subprocess  |
| (mlController.js)|                                          |   (predict.py)     |
+------------------+                                          +--------------------+
         ^                                                               |
         |                   Parsed JSON over stdout                     |
         +---------------------------------------------------------------+
```

### 1. Python Predictor API (`predict.py`)
Accepts worker features formatted as raw JSON text through arguments or standard inputs (`stdin`).
* **Input payload format**:
  ```json
  {"is_late": 0, "absences_30d": 1, "attendance_rate": 96.67, "overtime_hours": 0.0, "total_hours_worked": 8.0, "day_of_week": 1, "check_in_hour": 8, "check_out_hour": 17, "shift_type_encoded": 1, "is_present": 1}
  ```
* **Process**: Loads `'models/random_forest_model.pkl'`, structures the vector array correctly, runs `.predict()` to evaluate the category, runs `.predict_proba()` to extract confidence scores, and outputs a JSON object to standard output (`stdout`):
  ```json
  {"category": "Regular", "confidence": 0.98, "probabilities": {"Regular": 0.98, "Irregular": 0.02, "High_Risk": 0.0}}
  ```

### 2. Node.js Spawning Mechanics (`mlController.js`)
* **Spawning virtual environment on Windows**: On Windows operating systems, the script checks if the local virtual environment interpreter exists at `ML/venv/Scripts/python.exe`. If found, it invokes this explicit interpreter rather than the system's global `python` interpreter, preventing dependency errors.
* **Encoding Safety**: Avoids standard quoting issues across different CLI prompts by writing directly to `python.stdin` and closing the stream:
  ```javascript
  const python = spawn(pythonCmd, [PREDICT_SCRIPT]);
  python.stdin.write(JSON.stringify(workerData));
  python.stdin.end();
  ```
* **Warning Filtration**: Standard library version warnings or unpickling version warnings sent to standard error (`stderr`) are programmatically filtered, ensuring that only actual execution errors fail the request.
* **Failure Resiliency Fallback**: To ensure absolute uptime if a Python interpreter crashes or is missing during runtime, the controller implements a robust **in-memory statistical rule-based fallback model**:
  ```javascript
  const simpleCategory = stats.attendance_rate < 60 ? 'High_Risk' : stats.attendance_rate < 90 ? 'Irregular' : 'Regular';
  ```
  This guarantees that predictions are returned cleanly with a standard $80\%$ default confidence badge even in catastrophic runtime environments.
