-- Fix worker_id_sequence for existing demo workers
UPDATE workers SET worker_id_sequence = 1 WHERE worker_id = 'W001';
UPDATE workers SET worker_id_sequence = 2 WHERE worker_id = 'W002';
UPDATE workers SET worker_id_sequence = 3 WHERE worker_id = 'W003';
UPDATE workers SET worker_id_sequence = 4 WHERE worker_id = 'W004';
UPDATE workers SET worker_id_sequence = 5 WHERE worker_id = 'W005';
UPDATE workers SET worker_id_sequence = 6 WHERE worker_id = 'W006';
UPDATE workers SET worker_id_sequence = 7 WHERE worker_id = 'W007';
UPDATE workers SET worker_id_sequence = 8 WHERE worker_id = 'W008';
