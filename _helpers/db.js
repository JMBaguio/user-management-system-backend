const config = require('config.json')
const mysql = require('mysql2/promise')
const { Sequelize } = require('sequelize')

module.exports = db = {}

initialize()

async function initialize() {
    // Creates database if it doesn't exist
    const { host, port, user, password, database } = config.database
    const connection = await mysql.createConnection({ host, port, user, password })
    await connection.query(`CREATE DATABASE IF NOT EXISTS\`${database}\`; `)

    // Connect to database
    const sequelize = new Sequelize(database, user, password, { dialect: 'mysql' })

    // Initialize models and add them to the exported db object
    db.Account = require('../accounts/account.model')(sequelize)
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize)

    //Define Relationship
    db.Account.hasMany(db.RefreshToken, { oneDelete: 'CASCADE' })
    db.RefreshToken.belongsTo(db.Account)

    // Sync all models with database
    await sequelize.sync({ alter: true })
}