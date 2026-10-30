const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  labResults: { type: Map, of: String },
  notes: { type: String },
  aiAnalysis: { type: String }
});

module.exports = mongoose.model('Report', ReportSchema);
