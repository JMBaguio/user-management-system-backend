const { Op } = require('sequelize');
const db = require('_helper/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    _delete,
    getByEmployeeId,
    updateStatus,
    workflowDetails,
    getWorkflowModelById
};

async function getAll() {
    const workflows = await db.Workflow.findAll({
        include: [{
            model: db.Employee,
            as: 'employee',
            include: [{
                model: db.Department,
                as: 'department'
            }]
        }]
    });
    return workflows.map(x => workflowDetails(x));
}

async function getById(id) {
    const workflow = await db.Workflow.findByPk(id, {
        include: [{
            model: db.Employee,
            as: 'employee',
            include: [{
                model: db.Department,
                as: 'department'
            }]
        }]
    });
    if (!workflow) throw 'Workflow not found';
    return workflowDetails(workflow);
}

async function getByEmployeeId(employeeId) {
    const workflows = await db.Workflow.findAll({
        where: { employeeId },
        include: [{
            model: db.Employee,
            as: 'employee',
            include: [{
                model: db.Department,
                as: 'department'
            }]
        }]
    });
    return workflows.map(x => workflowDetails(x));
}

async function create(params) {
    const workflow = await db.Workflow.create(params);
    return getById(workflow.id);
}

async function update(id, params) {
    const workflow = await getWorkflowModelById(id);
    Object.assign(workflow, params);
    await workflow.save();
    return workflowDetails(workflow);
}

async function updateStatus(id, status) {
    const workflow = await getWorkflowModelById(id);
    workflow.status = status;
    if (status === 'completed') {
        workflow.endDate = new Date();
    }
    await workflow.save();
    return workflowDetails(workflow);
}

async function _delete(id) {
    const workflow = await getById(id);
    await workflow.destroy();
}

function workflowDetails(workflow) {
    const { id, employeeId, type, status, startDate, endDate, description, currentStep, totalSteps, metadata, createdAt, updatedAt, employee } = workflow;
    return {
        id,
        employeeId,
        type,
        status,
        startDate,
        endDate,
        description,
        currentStep,
        totalSteps,
        metadata,
        createdAt,
        updatedAt,
        employee: employee ? {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            department: employee.department ? {
                id: employee.department.id,
                name: employee.department.name
            } : null
        } : null
    };
}

async function getWorkflowModelById(id) {
    const workflow = await db.Workflow.findByPk(id);
    if (!workflow) throw 'Workflow not found';
    return workflow;
} 