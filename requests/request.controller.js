const express = require('express');
const router = express.Router();
const Joi = require('joi');
const requestService = require('./request.service');

const authorize = require('_middleware/authorize');
const validateRequest = require('_middleware/validate-request');
const Role = require('_helper/role');

// Routes
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.get('/employee/:employeeId', authorize(), getByEmployeeId);
router.post('/', authorize(), create);
router.put('/:id', authorize(), update);
router.delete('/:id', authorize(Role.Admin), _delete);
router.put('/:id/approve', authorize(Role.Admin), approveRequest);
router.put('/:id/reject', authorize(Role.Admin), rejectRequest);

module.exports = router;

// Schema
const createSchema = Joi.object({
    type: Joi.string().valid('equipment', 'leave', 'resource', 'other').required(),
    employeeId: Joi.number().required(),
    description: Joi.string().min(3).max(500).required(),
    items: Joi.array().items(
        Joi.object({
            description: Joi.string().required(),
            quantity: Joi.number().min(1).required()
        })
    ).optional()
});

const updateSchema = Joi.object({
    type: Joi.string().valid('equipment', 'leave', 'resource', 'other').optional(),
    description: Joi.string().min(3).max(500).optional(),
    items: Joi.array().items(
        Joi.object({
            description: Joi.string().required(),
            quantity: Joi.number().min(1).required()
        })
    ).optional()
}).min(1);

// Handlers
function getAll(req, res, next) {
    requestService.getAll()
        .then(requests => res.json(requests))
        .catch(next);
}

function getById(req, res, next) {
    requestService.getById(req.params.id)
        .then(request => res.json(request))
        .catch(next);
}

function getByEmployeeId(req, res, next) {
    requestService.getByEmployeeId(req.params.employeeId)
        .then(requests => res.json(requests))
        .catch(next);
}

function create(req, res, next) {
    requestService.create(req.body)
        .then(request => res.status(201).json(request))
        .catch(next);
}

function update(req, res, next) {
    requestService.update(req.params.id, req.body)
        .then(request => res.json(request))
        .catch(next);
}

function _delete(req, res, next) {
    requestService._delete(req.params.id)
        .then(() => res.json({ message: 'Request deleted successfully' }))
        .catch(next);
}

function approveRequest(req, res, next) {
    requestService.approveRequest(req.params.id)
        .then(request => res.json(request))
        .catch(next);
}

function rejectRequest(req, res, next) {
    requestService.rejectRequest(req.params.id)
        .then(request => res.json(request))
        .catch(next);
}
