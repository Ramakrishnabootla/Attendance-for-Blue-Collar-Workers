const mlController = require('./controllers/mlController');

// Simulate Express request and response objects
const req = {};
const res = {
  json: (data) => {
    console.log('SUCCESS RESPONSE:', JSON.stringify(data, null, 2));
  },
  status: (code) => {
    console.log(`STATUS CODE: ${code}`);
    return {
      json: (data) => {
        console.error('ERROR RESPONSE:', JSON.stringify(data, null, 2));
      }
    };
  }
};

console.log('Simulating explicit ML predictions generation...');
mlController.generateAllWorkerPredictions(req, res)
  .then(() => {
    console.log('Execution completed.');
  })
  .catch(err => {
    console.error('Execution crashed with error:', err);
  });
