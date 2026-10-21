const Expenses = require("../models/expenses");

const addExpense = async (req, res) => {
  try {
    const { amount, description, category, type, date } = req.body;

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !description?.trim() ||
      !category?.trim() ||
      !["credit", "debit"].includes(type) ||
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        message:
          "Please provide a valid amount, description, category, type and date.",
      });
    }

    const expense = await Expenses.create({
      amount,
      description: description.trim(),
      category: category.trim(),
      type,
      date,
      userId: req.userId,
    });

    res.status(201).json({
      message: "Transaction added successfully",
      expense,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Error adding transaction" });
  }
};

const fetchExpenses = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    const where = {
      userId: req.userId,
    };

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    if (date) {
      where.date = date;
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearValue, monthValue] = month.split("-").map(Number);
      if (monthValue < 1 || monthValue > 12) {
        return res.status(400).json({ message: "Invalid month." });
      }
      const startDate = `${month}-01`;
      const endDate = new Date(Date.UTC(yearValue, monthValue, 0))
        .toISOString()
        .slice(0, 10);
      const { Op } = require("sequelize");
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (month) {
      return res
        .status(400)
        .json({ message: "Month must be in YYYY-MM format." });
    } else if (year && /^\d{4}$/.test(year)) {
      const yearValue = Number(year);
      const { Op } = require("sequelize");
      where.date = {
        [Op.between]: [`${year}-01-01`, `${yearValue}-12-31`],
      };
    } else if (year) {
      return res.status(400).json({ message: "Year must be in YYYY format." });
    }

    const expenses = await Expenses.findAll({
      where,
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

const fetchExpenseById = async (req, res) => {
  try {
    const expense = await Expenses.findOne({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!expense) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ message: "Error fetching transaction" });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expenses.findOne({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!expense) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const { amount, description, category, type, date } = req.body;
    const updates = {};

    if (amount !== undefined) {
      if (
        amount === "" ||
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0
      ) {
        return res
          .status(400)
          .json({ message: "Amount must be greater than zero." });
      }
      updates.amount = amount;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({ message: "Description is required." });
      }
      updates.description = description.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({ message: "Category is required." });
      }
      updates.category = category.trim();
    }

    if (type !== undefined) {
      if (!["credit", "debit"].includes(type)) {
        return res
          .status(400)
          .json({ message: "Type must be credit or debit." });
      }
      updates.type = type;
    }

    if (date !== undefined) {
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({ message: "Invalid date." });
      }
      updates.date = date;
    }

    await expense.update(updates);

    res.status(200).json({
      message: "Transaction updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Error updating transaction" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expenses.findOne({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!expense) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await expense.destroy();

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Error deleting transaction" });
  }
};

module.exports = {
  addExpense,
  fetchExpenses,
  fetchExpenseById,
  updateExpense,
  deleteExpense,
};
