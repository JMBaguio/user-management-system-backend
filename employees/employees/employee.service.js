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
    // getByEmail,
    employeeDetails,
    transferEmployee,
}



async function getAll() {
    const employees = await db.Employee.findAll();
    const detailedEmployees = await Promise.all(employees.map(emp => employeeDetails(emp)));
    return detailedEmployees;

}

async function getById(id) {
    const employee = await getEmployee(id);
    return employeeDetails(employee);
}

async function employeeDetails(employee) {
    const { id, employeeId, position, departmentId, hireDate, isActive, accountId } = employee;

    // get account details 
    let account = null;
    try {
        account = await employee.getAccount();    
    } catch (error) {
        account = null; 
    }

    // get department details using the association
    let department = null;
    try {
        department = await employee.getDepartment();
    } catch (error) {
        department = null;
    }

    return {
        id,
        employeeId,
        position,
        departmentId,
        department: department ? department.name : null, // department name
        hireDate,
        isActive,
        accountId,
        account: account ? account.email : null // account email
    };
}

async function createOnboardingWorkflow(employee) {
    const workflow = await db.Workflow.create({
        employeeId: employee.id,
        type: 'onboarding',
        status: 'pending',
        startDate: new Date(),
        description: `Onboarding workflow for ${employee.employeeId}`,
        totalSteps: 5,
        metadata: {
            checklist: [
                "IT Setup",
                "HR Documentation",
                "Department Introduction",
                "Training Schedule",
                "Final Review"
            ]
        }
    });
    return workflow;
}

async function createTransferWorkflow(employee, oldDepartmentId, newDepartmentId) {
    const oldDepartment = await db.Department.findByPk(oldDepartmentId);
    const newDepartment = await db.Department.findByPk(newDepartmentId);
    
    const workflow = await db.Workflow.create({
        employeeId: employee.id,
        type: 'transfer',
        status: 'pending',
        startDate: new Date(),
        description: `Department transfer from ${oldDepartment.name} to ${newDepartment.name}`,
        totalSteps: 4,
        metadata: {
            checklist: [
                "Complete handover in current department",
                "Update system access and permissions",
                "New department orientation",
                "Final transfer confirmation"
            ],
            oldDepartment: oldDepartment.name,
            newDepartment: newDepartment.name
        }
    });
    return workflow;
}

async function create(params){
    // validation
    if (!params.position) {
        throw 'Position is required';
    }
    if (!params.employeeId) {
        throw 'Employee ID is required';
    }
    // Check for duplicate employeeId
    if (await db.Employee.findOne({ where: { employeeId: params.employeeId } })) {
        throw 'Employee ID "' + params.employeeId + '" is already taken';
    }
    // Check for duplicate account assignment
    const existing = await db.Employee.findOne({ where :{accountId: params.accountId}});
    if(existing) throw 'This account is already assigned to an employee';

    // Check if account exists
    const account = await db.Account.findByPk(params.accountId);
    if (!account) throw 'Account does not exist. Please create an account first.';

    const employee = new db.Employee(params);
    // save employee
    await employee.save();

    // Create onboarding workflow
    await createOnboardingWorkflow(employee);

    return employeeDetails(employee);
}

async function update(id, params) {
    const employee = await getEmployee(id);

    // validate
    const emailChanged = params.email && employee.email !== params.email;
    if (emailChanged && await db.Employee.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already taken';
    }

    // copy params to employee and save
    Object.assign(employee, params);
    await employee.save();
    return employeeDetails(employee);
}


async function _delete(id){
    const employee = await getEmployee(id);
    await employee.destroy();

}

async function getEmployee(id){
    // Try to find by primary key first
    let employee = await db.Employee.findByPk(id);
    
    // If not found by primary key, try to find by employeeId
    if (!employee) {
        employee = await db.Employee.findOne({ where: { employeeId: id } });
    }
    
    if (!employee) throw 'Employee not found';
    return employee;
}

async function transferEmployee(employeeId, newDepartmentId) {
    console.log('Starting transfer:', { employeeId, newDepartmentId });
    
    // Get the employee
    const employee = await getEmployee(employeeId);
    console.log('Found employee:', employee);
    
    // Validate the new department exists
    const department = await db.Department.findByPk(newDepartmentId);
    if (!department) {
        console.log('Department not found:', newDepartmentId);
        throw 'Department not found';
    }
    console.log('Found department:', department.name);
    
    // Check if trying to transfer to the same department
    if (employee.departmentId === newDepartmentId) {
        console.log('Same department transfer attempt');
        throw 'Cannot transfer to the same department';
    }
    
    // Store the old department ID before updating
    const oldDepartmentId = employee.departmentId;
    
    // Update the employee's department
    employee.departmentId = newDepartmentId;
    await employee.save();
    console.log('Employee updated with new department');
    
    // Create transfer workflow
    await createTransferWorkflow(employee, oldDepartmentId, newDepartmentId);
    console.log('Transfer workflow created');
    
    // Get the updated employee details
    const updatedEmployee = await employeeDetails(employee);
    console.log('Updated employee details:', updatedEmployee);
    
    // Add a success message
    updatedEmployee.message = 'Employee transferred successfully';
    
    return updatedEmployee;
}



