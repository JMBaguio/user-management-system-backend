module.exports = validateRequests

function validateRequests(req, next, schema) {
    const options = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: truncate
    }
    
    const { error, value } = schema.validate(req.body, options)
    if (error) {
        next(`Validation Error: ${error.details.map(x=>x.message).join(', ')}`)
    } else {
        req.body = value
        next()
    }
}