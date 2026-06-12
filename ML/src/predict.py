"""
Prediction Script for Random Forest Model
Loads the trained model and makes predictions on worker data
Used by backend ML endpoints
"""

import json
import sys
import warnings
import joblib
import numpy as np
from pathlib import Path

# Suppress sklearn version warning
warnings.filterwarnings('ignore', message='.*Trying to unpickle estimator.*')

# Get model path
model_path = Path(__file__).parent.parent / 'models' / 'random_forest_model.pkl'

def load_model():
    """Load the trained Random Forest model"""
    try:
        model = joblib.load(model_path)
        return model
    except Exception as e:
        raise Exception(f"Failed to load model: {str(e)}")

def predict(worker_data):
    """
    Make prediction for a worker
    
    Parameters:
    worker_data: dict with keys:
        - is_late
        - absences_30d
        - attendance_rate
        - overtime_hours
        - total_hours_worked
        - day_of_week
        - check_in_hour
        - check_out_hour
        - shift_type_encoded
        - is_present
    
    Returns:
    dict with prediction results
    """
    
    model = load_model()
    
    # Extract features in correct order
    feature_order = [
        'is_late', 'absences_30d', 'attendance_rate', 'overtime_hours',
        'total_hours_worked', 'day_of_week', 'check_in_hour', 'check_out_hour',
        'shift_type_encoded', 'is_present'
    ]
    
    # Create feature vector
    features = []
    for feature in feature_order:
        if feature not in worker_data:
            raise ValueError(f"Missing required feature: {feature}")
        features.append(float(worker_data[feature]))
    
    features = np.array([features])
    
    # Make prediction
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    
    # Get confidence (max probability)
    confidence = float(np.max(probabilities))
    
    # Create probability dict
    prob_dict = {}
    for i, class_name in enumerate(model.classes_):
        prob_dict[class_name] = float(probabilities[i])
    
    return {
        'category': prediction,
        'confidence': round(confidence, 4),
        'probabilities': prob_dict
    }

def main():
    """Main execution"""
    try:
        # Accept JSON via argv[1] or stdin to be robust across platforms
        if len(sys.argv) >= 2:
            raw_input = sys.argv[1]
        else:
            raw_input = sys.stdin.read()

        if not raw_input.strip():
            raise ValueError("Worker data JSON not provided via arguments or stdin")

        sys.stderr.write(f"DEBUG: raw_input = {raw_input}\n")

        worker_data = json.loads(raw_input)
        
        # Make prediction
        result = predict(worker_data)
        
        # Output as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_response = {
            'error': str(e),
            'category': 'ERROR',
            'confidence': 0.0,
            'probabilities': {}
        }
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == '__main__':
    main()
