"""
Random Forest Model Training for Worker Attendance Prediction
Trains and evaluates a Random Forest classifier to predict worker categories:
- Regular Worker
- Irregular Attendance  
- High Absence Risk
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)

def load_data(data_path=None):
    """Load synthetic dataset"""
    if data_path is None:
        data_path = str(Path(__file__).parent.parent / 'data' / 'synthetic_attendance_data.csv')
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    return df

def preprocess_data(df):
    """
    Preprocess data for model training
    Creates features from raw attendance data
    """
    print("\nPreprocessing data...")
    
    df_processed = df.copy()
    
    # Feature: Extract day of week from date
    df_processed['date'] = pd.to_datetime(df_processed['date'])
    df_processed['day_of_week'] = df_processed['date'].dt.dayofweek
    
    # Feature: Parse check_in time to extract hour
    df_processed['check_in_hour'] = df_processed['check_in'].fillna('00:00').apply(lambda x: int(x.split(':')[0]))
    df_processed['check_out_hour'] = df_processed['check_out'].fillna('00:00').apply(lambda x: int(x.split(':')[0]))
    
    # Feature: Shift type encoding
    shift_encoder = LabelEncoder()
    df_processed['shift_type_encoded'] = shift_encoder.fit_transform(df_processed['shift_type'].fillna('Unknown'))
    
    # Feature: Attendance presence (1 if present, 0 if absent)
    df_processed['is_present'] = (~df_processed['check_in'].isna()).astype(int)
    
    # Feature: Calculate presence rate in window
    df_processed['presence_rate'] = df_processed.groupby('worker_id')['is_present'].transform('mean')
    
    return df_processed, shift_encoder

def create_features(df_processed):
    """
    Create feature matrix for model training
    """
    print("Creating feature matrix...")
    
    feature_columns = [
        'is_late',
        'absences_30d',
        'attendance_rate',
        'overtime_hours',
        'total_hours_worked',
        'day_of_week',
        'check_in_hour',
        'check_out_hour',
        'shift_type_encoded',
        'is_present'
    ]
    
    # Fill NaN values with 0
    X = df_processed[feature_columns].fillna(0)
    y = df_processed['worker_category']
    
    print(f"Features shape: {X.shape}")
    print(f"Target distribution:\n{y.value_counts()}")
    
    return X, y

def train_model(X, y):
    """
    Train Random Forest Classifier
    """
    print("\nTraining Random Forest model...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Training set size: {X_train.shape[0]}")
    print(f"Test set size: {X_test.shape[0]}")
    
    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    
    train_accuracy = accuracy_score(y_train, y_pred_train)
    test_accuracy = accuracy_score(y_test, y_pred_test)
    
    print(f"\n[SUCCESS] Model trained!")
    print(f"  Training Accuracy: {train_accuracy:.4f} ({train_accuracy*100:.2f}%)")
    print(f"  Testing Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
    
    print("\nClassification Report (Test Set):")
    print(classification_report(y_test, y_pred_test))
    
    print("\nConfusion Matrix (Test Set):")
    cm = confusion_matrix(y_test, y_pred_test)
    print(cm)
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': ['is_late', 'absences_30d', 'attendance_rate', 'overtime_hours', 
                   'total_hours_worked', 'day_of_week', 'check_in_hour', 'check_out_hour', 
                   'shift_type_encoded', 'is_present'],
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nFeature Importance:")
    print(feature_importance)
    
    return model, X_test, y_test, feature_importance

def save_model(model, model_path=None):
    if model_path is None:
        model_path = str(Path(__file__).parent.parent / 'models' / 'random_forest_model.pkl')
    """Save trained model"""
    Path(model_path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    print(f"\n[SUCCESS] Model saved: {model_path}")

def create_visualizations(model, X_test, y_test, feature_importance):
    """Create evaluation visualizations"""
    print("\nGenerating visualizations...")
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # 1. Feature Importance
    ax1 = axes[0, 0]
    feature_importance.head(10).plot(x='feature', y='importance', kind='barh', ax=ax1, color='steelblue')
    ax1.set_title('Top 10 Feature Importance', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Importance')
    ax1.invert_yaxis()
    
    # 2. Confusion Matrix
    ax2 = axes[0, 1]
    y_pred = model.predict(X_test)
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax2, cbar=False)
    ax2.set_title('Confusion Matrix', fontsize=12, fontweight='bold')
    ax2.set_ylabel('True Label')
    ax2.set_xlabel('Predicted Label')
    
    # 3. Prediction distribution
    ax3 = axes[1, 0]
    unique, counts = np.unique(y_pred, return_counts=True)
    ax3.bar(unique, counts, color='lightcoral')
    ax3.set_title('Prediction Distribution', fontsize=12, fontweight='bold')
    ax3.set_ylabel('Count')
    ax3.set_xlabel('Worker Category')
    
    # 4. Accuracy metrics
    ax4 = axes[1, 1]
    ax4.axis('off')
    accuracy = accuracy_score(y_test, y_pred)
    metrics_text = f"""
    Model Performance Metrics
    {'='*35}
    
    Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)
    
    Test Set Size: {len(y_test)}
    
    Classes:
    - Regular Worker
    - Irregular Attendance
    - High Absence Risk
    
    Features: 10
    Trees: 100
    Max Depth: 15
    """
    ax4.text(0.1, 0.5, metrics_text, fontsize=11, family='monospace', 
             bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    plt.tight_layout()
    viz_path = str(Path(__file__).parent.parent / 'models' / 'model_evaluation.png')
    plt.savefig(viz_path, dpi=300, bbox_inches='tight')
    print(f"[SUCCESS] Visualizations saved: {viz_path}")
    plt.close()

def main():
    """Main execution"""
    print("="*60)
    print("WORKER ATTENDANCE PREDICTION MODEL TRAINING")
    print("="*60)
    
    try:
        # Load and preprocess
        df = load_data()
        df_processed, shift_encoder = preprocess_data(df)
        
        # Create features
        X, y = create_features(df_processed)
        
        # Train model
        model, X_test, y_test, feature_importance = train_model(X, y)
        
        # Save model
        save_model(model)
        
        # Create visualizations
        create_visualizations(model, X_test, y_test, feature_importance)
        
        print("\n" + "="*60)
        print("[SUCCESS] MODEL TRAINING COMPLETED SUCCESSFULLY!")
        print("="*60)
        
    except Exception as e:
        print(f"\n[ERROR] Error during training: {str(e)}")
        raise

if __name__ == '__main__':
    main()
