const workerService = require('../services/workerService');

const getWorkers = async (req, res) => {
  return await workerService.getWorkers(req, res);
};

const createWorker = async (req, res) => {
  return await workerService.createWorker(req, res);
};

const searchWorkers = async (req, res) => {
  return await workerService.searchWorkers(req, res);
};

const getNextWorkerId = async (req, res) => {
  return await workerService.getNextWorkerId(req, res);
};

const updateWorker = async (req, res) => {
  return await workerService.updateWorker(req, res);
};

const deactivateWorker = async (req, res) => {
  return await workerService.deactivateWorker(req, res);
};

const activateWorker = async (req, res) => {
  return await workerService.activateWorker(req, res);
};

const getWorkerByWorkerId = async (req, res) => {
  return await workerService.getWorkerByWorkerId(req, res);
};

const getContractors = async (req, res) => {
  return await workerService.getContractors(req, res);
};

module.exports = {
  getWorkers,
  createWorker,
  searchWorkers,
  getNextWorkerId,
  updateWorker,
  deactivateWorker,
  activateWorker,
  getWorkerByWorkerId,
  getContractors
};
