"""
Synthetic Dataset Generator for Worker Attendance Prediction
Generates realistic attendance data for model training
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_synthetic_dataset(n_samples=1000):
    """
    Generate synthetic attendance dataset
    
    Parameters:
    n_samples: Number of attendance records to generate
    
    Returns:
    DataFrame with synthetic attendance data
    """
    
    np.random.seed(42)
    random.seed(42)
    
    # Generate worker and contractor IDs
    n_workers = 150
    n_contractors = 5
    
    data = {
        'worker_id': [],
        'name': [],
        'contractor_id': [],
        'date': [],
        'check_in': [],
        'check_out': [],
        'shift_type': [],
        'is_late': [],
        'absences_30d': [],
        'attendance_rate': [],
        'overtime_hours': [],
        'total_hours_worked': [],
        'worker_category': []
    }
    
    # Generate records
    base_date = datetime(2023, 1, 1)
    
    for i in range(n_samples):
        worker_id = np.random.randint(1001, 1001 + n_workers)
        contractor_id = np.random.randint(101, 101 + n_contractors)
        
        # Determine worker category (affects attendance pattern)
        category = np.random.choice(['Regular', 'Irregular', 'High_Risk'], p=[0.6, 0.25, 0.15])
        
        # Generate date
        date = base_date + timedelta(days=np.random.randint(0, 365))
        
        # Skip Sundays (day_of_week = 6)
        while date.weekday() == 6:
            date += timedelta(days=1)
        
        # Generate attendance based on category
        if np.random.random() < (0.95 if category == 'Regular' else 0.6 if category == 'Irregular' else 0.4):
            # Worker is present
            shift_type = np.random.choice(['Morning', 'Evening', 'Full'], p=[0.3, 0.3, 0.4])
            
            if shift_type == 'Morning':
                check_in = f"{np.random.randint(5, 8):02d}:{np.random.randint(0, 60):02d}"
                check_out = f"{np.random.randint(12, 14):02d}:{np.random.randint(0, 60):02d}"
                is_late = 1 if int(check_in.split(':')[0]) > 8 else 0
            elif shift_type == 'Evening':
                check_in = f"{np.random.randint(14, 16):02d}:{np.random.randint(0, 60):02d}"
                check_out = f"{np.random.randint(22, 24):02d}:{np.random.randint(0, 60):02d}"
                is_late = 1 if int(check_in.split(':')[0]) > 16 else 0
            else:  # Full
                check_in = f"{np.random.randint(5, 8):02d}:{np.random.randint(0, 60):02d}"
                check_out = f"{np.random.randint(17, 19):02d}:{np.random.randint(0, 60):02d}"
                is_late = 1 if int(check_in.split(':')[0]) > 8 else 0
            
            # Calculate hours worked
            check_in_hour = int(check_in.split(':')[0]) + int(check_in.split(':')[1]) / 60
            check_out_hour = int(check_out.split(':')[0]) + int(check_out.split(':')[1]) / 60
            if check_out_hour < check_in_hour:  # Night shift
                check_out_hour += 24
            total_hours = check_out_hour - check_in_hour
            
            # Add overtime variability
            overtime = np.random.choice([0, 0.5, 1, 1.5, 2], p=[0.7, 0.1, 0.1, 0.05, 0.05])
            
        else:
            # Worker is absent
            check_in = None
            check_out = None
            shift_type = None
            is_late = 0
            total_hours = 0
            overtime = 0
        
        # Calculate 30-day absence count (based on category)
        if category == 'High_Risk':
            absences_30d = np.random.randint(0, 9)  # 0-8 absences
        elif category == 'Irregular':
            absences_30d = np.random.randint(0, 3)  # 0-2 absences
        else:  # Regular
            absences_30d = np.random.randint(0, 1)  # 0 absences
        
        # Calculate attendance rate
        if category == 'High_Risk':
            attendance_rate = np.random.uniform(0.4, 0.6)
        elif category == 'Irregular':
            attendance_rate = np.random.uniform(0.75, 0.95)
        else:  # Regular
            attendance_rate = np.random.uniform(0.95, 1.0)
        
        # Generate worker name
        first_names = ['Rajesh', 'Priya', 'Amit', 'Deepak', 'Neha', 'Vikram', 'Arjun', 'Sneha', 'Rohan', 'Pooja']
        last_names = ['Kumar', 'Singh', 'Sharma', 'Patel', 'Gupta', 'Verma', 'Joshi', 'Reddy', 'Nair', 'Rao']
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        
        data['worker_id'].append(worker_id)
        data['name'].append(name)
        data['contractor_id'].append(contractor_id)
        data['date'].append(date.strftime('%Y-%m-%d'))
        data['check_in'].append(check_in)
        data['check_out'].append(check_out)
        data['shift_type'].append(shift_type)
        data['is_late'].append(is_late)
        data['absences_30d'].append(absences_30d)
        data['attendance_rate'].append(round(attendance_rate, 2))
        data['overtime_hours'].append(round(overtime, 2))
        data['total_hours_worked'].append(round(total_hours, 2))
        data['worker_category'].append(category)
    
    df = pd.DataFrame(data)
    return df

if __name__ == '__main__':
    print("Generating synthetic dataset...")
    df = generate_synthetic_dataset(n_samples=1000)
    
    # Save to CSV
    output_path = 'data/synthetic_attendance_data.csv'
    df.to_csv(output_path, index=False)
    
    print(f"✓ Dataset generated: {output_path}")
    print(f"  Shape: {df.shape}")
    print(f"\nDataset Preview:")
    print(df.head(10))
    print(f"\nClass Distribution:")
    print(df['worker_category'].value_counts())
    print(f"\nDataset Info:")
    print(df.info())
