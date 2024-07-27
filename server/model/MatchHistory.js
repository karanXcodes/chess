const mongoose = require('mongoose');

const MatchHistorySchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  opponent: {
    type: String,
    required: true,
  },
  change: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model('MatchHistory', MatchHistorySchema);
