
const axios = require("axios");

async function sendEmail(toEmail) {
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "Expense Tracker",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: toEmail,
        },
      ],
      subject: "Expense Tracker - Test Email",
      textContent:
        "Hello! This is a test email from your Expense Tracker application.",
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  return response.data;
}

module.exports = { sendEmail };
