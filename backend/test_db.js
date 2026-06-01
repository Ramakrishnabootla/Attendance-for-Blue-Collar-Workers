const { supabase } = require('./config/db');

async function testConnection() {
  console.log('Testing Supabase Connection...');
  
  // 1. Check active workers
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('worker_id, name')
    .eq('is_active', true);
    
  if (workersError) {
    console.error('Error fetching workers:', workersError.message);
    return;
  }
  console.log(`✓ Active Workers Found: ${workers ? workers.length : 0}`);
  if (workers) {
    console.log('Sample Workers:', workers.slice(0, 3));
  }

  // 2. Try fetching from ml_predictions
  const { data: predictions, error: predError } = await supabase
    .from('ml_predictions')
    .select('*');
    
  if (predError) {
    console.error('Error fetching from ml_predictions:', predError.message, 'Code:', predError.code);
    console.log('NOTE: If this code is "PGRST116" or similar error, the table "ml_predictions" might not exist yet.');
  } else {
    console.log(`✓ ml_predictions table exists! Rows found: ${predictions ? predictions.length : 0}`);
  }
}

testConnection();
