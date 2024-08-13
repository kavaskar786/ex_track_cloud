const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  summary: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
});

module.exports = mongoose.model('Expense', ExpenseSchema);
