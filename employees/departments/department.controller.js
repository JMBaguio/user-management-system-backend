const express = require('express');
const router = express.Router();
const Joi = require('joi');
const departmentService = require('./department.service');

const authorize = require('_middleware/authorize');
const validateRequest = require('_middleware/validate-request');
const Role = require('_helper/role');

// Routes
router.get('/', authorize(Role.Admin), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

// Schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional()
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().optional(),
        description: Joi.string().optional()
    });
    validateRequest(req, next, schema);
}

// Handlers
function getAll(req, res, next) {
    departmentService.getAll()
        .then(departments => res.json(departments))
        .catch(next);
}

function getById(req, res, next) {
    departmentService.getById(req.params.id)
        .then(department => res.json(department))
        .catch(next);
}

function create(req, res, next) {
    departmentService.create(req.body)
        .then(department => res.status(201).json(department))
        .catch(next);
}

function update(req, res, next) {
    departmentService.update(req.params.id, req.body)
        .then(department => res.json(department))
        .catch(next);
}

function _delete(req, res, next) {
    departmentService._delete(req.params.id)
        .then(() => res.json({ message: 'Department deleted successfully' }))
        .catch(next);
}

module.exports = router;
