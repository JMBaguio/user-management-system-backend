const nodemailer = require('nodemailer')
const config = require('config.json')

module.exports = sendEmail

async function sendEmail({ to, subject, htm, from = config.emailFrom }) {
    const transporter = nodemailer.createTransport(config.smtpOptions)
    await transporter.sendMail({ from, to, subject, html})
}