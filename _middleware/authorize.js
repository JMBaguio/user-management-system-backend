const jwt = require('express-jwt')
const { secret } = require('config.json')
const db = require('_helpers/db')

module.exports = authorize

function authorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles]
    }
    return [
        //authenticate JWT token and attach user to request object
        jwt({ secret, algorithms: ['HS256']}),

        //authorize based on user role
        async (req, res, next) => {
            const account = await db.Account.findByPk(req.user.id)

            if (!account || (roles.length && !roles.includes(account.role))) {
                // account no longer exists or role not authorized
                return res.status(401).json({ message: 'Unauthorized' })
            }

            //authentiation and authorization successful
            req.user.role = account.role
            const RefreshTokens = await account.getRefreshTokens()
            req.user.ownsToken = token => !!RefreshTokens.find(x => x.token === token)
            next()
        }
    ]
}