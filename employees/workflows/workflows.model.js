const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Employees',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['onboarding', 'offboarding', 'transfer', 'promotion']]
            }
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'approved', 'rejected']]
            }
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        currentStep: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        totalSteps: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true
        }
    };

    const options = {
        timestamps: true
    };

    return sequelize.define('workflow', attributes, options);
}
