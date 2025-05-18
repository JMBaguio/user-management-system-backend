const express = require('express');
const router = express.Router();
const Joi = require('joi');
const workflowService = require('./workflows.service');

const authorize = require('_middleware/authorize');
const validateRequest = require('_middleware/validate-request');
const Role = require('_helper/role');

// Schema definitions
const createSchema = (req, res, next) => {
    const schema = Joi.object({
        employeeId: Joi.number().required(),
        type: Joi.string().valid('onboarding', 'offboarding', 'transfer', 'promotion').required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().allow(null),
        description: Joi.string().allow(null, ''),
        totalSteps: Joi.number().min(1).required(),
        metadata: Joi.object().allow(null)
    });
    validateRequest(req, next, schema);
};

const updateSchema = (req, res, next) => {
    const schema = Joi.object({
        type: Joi.string().valid('onboarding', 'offboarding', 'transfer', 'promotion'),
        startDate: Joi.date(),
        endDate: Joi.date().allow(null),
        description: Joi.string().allow(null, ''),
        currentStep: Joi.number().min(1),
        totalSteps: Joi.number().min(1),
        metadata: Joi.object().allow(null)
    }).min(1);
    validateRequest(req, next, schema);
};

const updateStatusSchema = (req, res, next) => {
    const schema = Joi.object({
        status: Joi.string().valid('pending', 'approved','rejected').required()
    });
    validateRequest(req, next, schema);
};

// Routes
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.post('/', authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(Role.Admin), updateSchema, update);
router.put('/:id/status', authorize(Role.Admin), updateStatusSchema, updateStatus);
router.delete('/:id', authorize(Role.Admin), _delete);

module.exports = router;

// Handlers
function getAll(req, res, next) {
    workflowService.getAll()
        .then(workflows => res.json(workflows))
        .catch(next);
}

function getById(req, res, next) {
    workflowService.getById(req.params.id)
        .then(workflow => res.json(workflow))
        .catch(next);
}

function getByEmployeeId(req, res, next) {
    workflowService.getByEmployeeId(req.params.employeeId)
        .then(workflows => res.json(workflows))
        .catch(next);
}

function create(req, res, next) {
    workflowService.create(req.body)
        .then(workflow => res.status(201).json(workflow))
        .catch(next);
}

function update(req, res, next) {
    workflowService.update(req.params.id, req.body)
        .then(workflow => res.json(workflow))
        .catch(next);
}

function updateStatus(req, res, next) {
    workflowService.updateStatus(req.params.id, req.body.status)
        .then(workflow => res.json(workflow))
        .catch(next);
}

function _delete(req, res, next) {
    workflowService._delete(req.params.id)
        .then(() => res.json({ message: 'Workflow deleted successfully' }))
        .catch(next);
}
