const { User, Order, Expenses } = require("../models");
const { fn, col, literal } = require("sequelize");
const cashfree = require("../utils/cashfree");
const { randomUUID } = require("crypto");

exports.createOrder = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isPremium) {
      return res.status(400).json({
        message: "You already have Premium Membership.",
      });
    }

    const amount = Number(process.env.PREMIUM_MEMBERSHIP_AMOUNT || 500);
    const orderId = `premium_${randomUUID().replace(/-/g, "")}`;

    // Cashfree requires a customer phone number.
    // We'll use the user's phone if your model has one,
    // otherwise a sandbox test number for this integration.
    const customerPhone = user.phone || "9999999999";

    await Order.create({
      orderId,
      userId: user.id,
      amount,
      status: "PENDING",
    });

    try {
      const response = await cashfree.PGCreateOrder({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(user.id),
          customer_name: user.name,
          customer_email: user.email,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: `http://127.0.0.1:5500/frontend/payment-result.html?order_id={order_id}`,
        },
      });
      console.log("Cashfree order response:", response.data);

      return res.status(201).json({
        orderId,
        paymentSessionId: response.data.payment_session_id,
      });
    } catch (cashfreeError) {
      await Order.update(
        { status: "FAILED" },
        { where: { orderId, userId: user.id } },
      );

      throw cashfreeError;
    }
  } catch (error) {
    console.error("Create order error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Could not create the payment order.",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    // Only allow the logged-in user to verify their own order.
    const order = await Order.findOne({
      where: {
        orderId,
        userId: req.userId,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Fetch the actual payment attempts from Cashfree.
    const response = await cashfree.PGOrderFetchPayments(orderId);
    const payments = response.data || [];

    const successfulPayment = payments.find(
      (payment) =>
        payment.payment_status === "SUCCESS" &&
        Number(payment.payment_amount) === Number(order.amount),
    );

    if (successfulPayment) {
      await order.update({ status: "SUCCESSFUL" });

      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      await user.update({ isPremium: true });

      return res.json({
        status: "SUCCESSFUL",
        message: "Premium Membership activated successfully.",
      });
    }

    const terminalStatuses = ["FAILED", "USER_DROPPED", "NOT_ATTEMPTED"];

    const allAttemptsFinished =
      payments.length > 0 &&
      payments.every((payment) =>
        terminalStatuses.includes(payment.payment_status),
      );

    if (allAttemptsFinished) {
      await order.update({ status: "FAILED" });

      // Find the latest failed payment attempt.
      const failedPayment = [...payments]
        .filter((payment) => terminalStatuses.includes(payment.payment_status))
        .sort(
          (a, b) =>
            new Date(b.payment_time || 0) - new Date(a.payment_time || 0),
        )[0];

      const failureReason =
        failedPayment?.error_details?.error_description ||
        failedPayment?.payment_message ||
        "Your payment could not be completed.";

      return res.json({
        status: "FAILED",
        message: "Your payment was unsuccessful.",
        failureReason,
        failureCode: failedPayment?.error_details?.error_code || null,
      });
    }

    // A pending payment must not activate membership.
    return res.json({
      status: "PENDING",
      message: "Payment is still being processed.",
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error.response?.data || error.message,
    );

    return res.status(500).json({
      message: "Could not verify the payment. Please try again.",
    });
  }
};

exports.getLatestOrder = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const order = await Order.findOne({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      isPremium: user.isPremium,
      status: order ? order.status : "NO_ORDER",
      amount: order ? order.amount : null,
      orderId: order ? order.orderId : null,
      createdAt: order ? order.createdAt : null,
    });
  } catch (error) {
    console.error("Get latest order error:", error);

    return res.status(500).json({
      message: "Could not fetch the latest order.",
    });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    // Check logged-in user
    const currentUser = await User.findByPk(req.userId);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Only premium users can access leaderboard
    if (!currentUser.isPremium) {
      return res.status(403).json({
        message: "Premium membership is required to view the leaderboard.",
      });
    }

    // Fetch all users
    const users = await User.findAll({
      attributes: [
        "id",
        "name",
        [fn("COALESCE", fn("SUM", col("Expenses.amount")), 0), "totalExpenses"],
      ],
      include: [
        {
          model: Expenses,
          attributes: [],
          where: { type: "debit" },
          required: false,
        },
      ],
      group: ["User.id"],
      order: [[literal("totalExpenses"), "DESC"]],
    });

    // Calculate total debit expenses for each user
    const expenseTotals = await Expenses.findAll({
      attributes: ["userId", [fn("SUM", col("amount")), "totalExpenses"]],
      where: {
        type: "debit",
      },
      group: ["userId"],
      raw: true,
    });

    // Create a map of user expense totals
    const totalsMap = {};

    expenseTotals.forEach((expense) => {
      totalsMap[expense.userId] = Number(expense.totalExpenses);
    });

    // Add totals to users and sort by highest expenses
    const leaderboard = users
      .map((user) => ({
        name: user.name,
        totalExpenses: totalsMap[user.id] || 0,
      }))
      .sort((a, b) => b.totalExpenses - a.totalExpenses)
      .map((user, index) => ({
        rank: index + 1,
        ...user,
      }));

    return res.status(200).json({
      leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);

    return res.status(500).json({
      message: "Could not fetch leaderboard.",
    });
  }
};
