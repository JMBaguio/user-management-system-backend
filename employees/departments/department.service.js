const config = require('config.json');
const { Op } = require('sequelize');
const db = require('_helper/db');
const { get } = require('http');

module.exports = {
    getAll,
    getById,
    create,
    update,
    _delete,
    departmentCounts,
    departmentDetails,
};

async function getAll() {
    const departments = await db.Department.findAll();
    return departments.map(x => departmentDetails(x));
}

async function getById(id) {
    const department = await getDepartment(id);
    return departmentDetails(department);
}

function departmentDetails(department) {
    const { id, name, description } = department;
    return { id, name, description };
}

async function create(params) {
    // validation
    if (!params.name) {
        throw new Error('Department name is required');
    }
    if (!params.description) {
        throw new Error('Dept description is required');
    }

    const department = new db.Department(params);
    // save department
    await department.save();
    return departmentDetails(department);
}

async function update(id, params) {
    const department = await getDepartment(id);

    // copy params to department and save
    Object.assign(department, params);
    await department.save();
    return departmentDetails(department);
}

async function _delete(id) {
    const department = await getDepartment(id);
    await department.destroy();
}

async function getDepartment(id) {
    const department = await db.Department.findByPk(id);
    if (!department) throw new Error('Department not found');
    return department;
}

async function departmentCounts() {
    const departments = await db.Department.findAll({
        include: [{
            model: db.Employee,
            attributes: [[db.Sequelize.fn('COUNT', db.Sequelize.col('employees.id')), 'employeeCount']],
        }],
        group: ['Department.id']
    });
    return departments.map(department => {
        return {
            id: department.id,
            name: department.name,
            employeeCount: department.employees[0] ? department.employees[0].employeeCount : 0
        };
    });
}
