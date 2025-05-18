const config = require('config.json');
const { Op } = require('sequelize');
const db = require('_helper/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    _delete,
    approveRequest,
    rejectRequest,
    getByEmployeeId
};

async function getAll() {
    const requests = await db.Request.findAll({
        include: [
            {
                model: db.Employee,
                as: 'Employee',
                attributes: ['id', 'employeeId', 'position'],
                include: [{
                    model: db.Account,
                    attributes: ['firstName', 'lastName', 'email']
                }]
            },
            {
                model: db.RequestItem,
                as: 'RequestItems',
                attributes: ['id', 'description', 'quantity']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
    return requests.map(x => requestDetails(x));
}

async function getById(id) {
    const request = await getRequest(id);
    return requestDetails(request);
}

async function getByEmployeeId(employeeId) {
    const requests = await db.Request.findAll({
        where: { 
            employeeId,
            isActive: true
        },
        include: [
            {
                model: db.Employee,
                as: 'Employee',
                attributes: ['id', 'employeeId', 'position'],
                include: [{
                    model: db.Account,
                    attributes: ['firstName', 'lastName', 'email']
                }]
            },
            {
                model: db.RequestItem,
                as: 'RequestItems',
                attributes: ['id', 'description', 'quantity']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
    return requests.map(x => requestDetails(x));
}

function requestDetails(request) {
    const { id, type, status, description, createdAt, updatedAt, employeeId, isActive, Employee, RequestItems } = request;
    return {
        id,
        type,
        status,
        description,
        createdAt,
        updatedAt,
        employeeId,
        isActive,
        employee: Employee ? {
            id: Employee.id,
            employeeId: Employee.employeeId,
            position: Employee.position,
            firstName: Employee.Account?.firstName,
            lastName: Employee.Account?.lastName,
            email: Employee.Account?.email
        } : null,
        items: RequestItems || []
    };
}

async function create(params) {
    // validation
    if (!params.type) {
        throw new Error('Request type is required');
    }
    if (!params.employeeId) {
        throw new Error('Employee ID is required');
    }
    if (!params.description) {
        throw new Error('Description is required');
    }

    // Check if employee exists
    const employee = await db.Employee.findByPk(params.employeeId);
    if (!employee) {
        throw new Error('Employee not found');
    }

    try {
        // Create the request
        const request = await db.Request.create({
            type: params.type,
            description: params.description,
            employeeId: params.employeeId,
            status: 'Pending',
            isActive: true
        });

        // Create request items if provided
        if (params.items && Array.isArray(params.items) && params.items.length > 0) {
            for (const item of params.items) {
                await db.RequestItem.create({
                    description: item.description,
                    quantity: item.quantity || 1,
                    requestId: request.id
                });
            }
        }

        // Get the complete request with items
        const completeRequest = await db.Request.findByPk(request.id, {
            include: [
                {
                    model: db.Employee,
                    as: 'Employee',
                    attributes: ['id', 'employeeId', 'position'],
                    include: [{
                        model: db.Account,
                        attributes: ['firstName', 'lastName', 'email']
                    }]
                },
                {
                    model: db.RequestItem,
                    as: 'RequestItems',
                    attributes: ['id', 'description', 'quantity']
                }
            ]
        });

        return requestDetails(completeRequest);
    } catch (error) {
        throw error;
    }
}

async function update(id, params) {
    const request = await getRequest(id);

    // Don't allow updating status through regular update
    const { status, items, ...updateData } = params;
    
    // Start a transaction
    const transaction = await db.sequelize.transaction();

    try {
        // Update request
        Object.assign(request, updateData);
        await request.save({ transaction });

        // Update items if provided
        if (items) {
            // Delete existing items
            await db.RequestItem.destroy({
                where: { requestId: id },
                transaction
            });

            // Create new items
            if (Array.isArray(items) && items.length > 0) {
                const requestItems = items.map(item => ({
                    description: item.description,
                    quantity: item.quantity || 1,
                    requestId: id
                }));
                await db.RequestItem.bulkCreate(requestItems, { 
                    transaction,
                    validate: true
                });
            }
        }

        // Get the complete request with items
        const completeRequest = await db.Request.findByPk(id, {
            include: [
                {
                    model: db.Employee,
                    as: 'Employee',
                    attributes: ['id', 'employeeId', 'position'],
                    include: [{
                        model: db.Account,
                        attributes: ['firstName', 'lastName', 'email']
                    }]
                },
                {
                    model: db.RequestItem,
                    as: 'RequestItems',
                    attributes: ['id', 'description', 'quantity']
                }
            ],
            transaction
        });

        // Commit the transaction
        await transaction.commit();

        return requestDetails(completeRequest);
    } catch (error) {
        // Rollback the transaction in case of error
        await transaction.rollback();
        throw error;
    }
}

async function _delete(id) {
    await db.Request.destroy({ where: { id } });
}

async function approveRequest(id) {
    const request = await db.Request.findByPk(id);
    if (!request) throw new Error('Request not found');
    if (request.status === 'Approved') {
        throw new Error('Request is already approved');
    }
    request.status = 'Approved';
    await request.save();
    return await getRequest(id);
}

async function rejectRequest(id) {
    const request = await db.Request.findByPk(id);
    if (!request) throw new Error('Request not found');
    if (request.status === 'Rejected') {
        throw new Error('Request is already rejected');
    }
    request.status = 'Rejected';
    await request.save();
    return await getRequest(id);
}


async function getRequest(id, transaction = null) {
    const options = {
        include: [
            {
                model: db.Employee,
                as: 'Employee',
                attributes: ['id', 'employeeId', 'position'],
                include: [{
                    model: db.Account,
                    attributes: ['firstName', 'lastName', 'email']
                }]
            },
            {
                model: db.RequestItem,
                as: 'RequestItems',
                attributes: ['id', 'description', 'quantity']
            }
        ]
    };

    // Add transaction to options if provided
    if (transaction) {
        options.transaction = transaction;
    }

    const request = await db.Request.findByPk(id, options);
    if (!request) throw new Error('Request not found');
    return requestDetails(request);
}
