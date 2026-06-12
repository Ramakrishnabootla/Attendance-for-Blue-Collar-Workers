const mlService = require('../services/mlService');

exports.predictWorkerCategory = async (req, res) => {
  return await mlService.predictWorkerCategory(req, res);
};

exports.getWorkerPrediction = async (req, res) => {
  return await mlService.getWorkerPrediction(req, res);
};

exports.batchPrediction = async (req, res) => {
  return await mlService.batchPrediction(req, res);
};

exports.getAllWorkerPredictions = async (req, res) => {
  return await mlService.getAllWorkerPredictions(req, res);
};

exports.generateAllWorkerPredictions = async (req, res) => {
  return await mlService.generateAllWorkerPredictions(req, res);
};

module.exports = exports;
