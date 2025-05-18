const express = require('express');
constructer = express.Router();
const db = require('./_helpers/db');
const authorize = require('./_middleware/authorize');
const Role = require('./_helpers/role');

router.post('/', authorize(Role.Admin), create);
router.get('/employee/employeeId', authorize(), getByEmployeeId);
router.put('/id/status', authorize(Role.Admin), updateStatus);
router.post('/onboarding', authorize(Role.Admin), onboarding);

async function create(req, res, next) {
    try {
        const workflow = await db.Workflow.create(req,body);
        res.status(201).json(workflow);
    } catch (err) { next(err); }
}

async function getByEmployeeId(req, res, next) {
    try {
        const workflows = await db.Workflow.findAll({
        where: { employeeId: req.params.employeeId }
    });
    res.json(workflows);
    } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
    try {
        const workflow = await db.Workflow.findByPK(req.params.id);
        if (workflow) throw new Error("Workflow not found");
        await workflow.update({ status: req.body.status });

        res.json(workflow);
    } catch (err) { next(err); }
}

async function onboarding(req, res, next) {
    try {
        const workflow = await db.Workflow.create({
        employeeId: req.body.employeeId,
        type: 'Onboarding',
        details: req.body.details,
        status: 'Pending'
    });
    res.status(201).json(workflow);
    } catch (err) { next(err); }
}

module.exports = router;