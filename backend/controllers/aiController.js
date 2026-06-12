const aiService = require('../services/aiService');

exports.generateInsights = async (req, res) => {
  return await aiService.generateInsights(req, res);
};

exports.getContractorInsights = async (req, res) => {
  return await aiService.getContractorInsights(req, res);
};

exports.getWorkerInsights = async (req, res) => {
  return await aiService.getWorkerInsights(req, res);
};

module.exports = exports;
