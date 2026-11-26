
const { sendEmail } = require("../services/brevoService");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    await sendEmail(email);

    res.status(200).json({
      message: "Test email sent successfully!",
    });
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "Unable to send email. Please try again.",
    });
  }
};

module.exports = { forgotPassword };
