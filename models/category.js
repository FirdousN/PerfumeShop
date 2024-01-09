const mongoose = require("mongoose");

const Category = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  image: [],

  description: {
    type: String,
    required: true,
  },
  is_listed: {
    type: Boolean,
    required: true,
  },
  categoryAddDate: {
    type: Date,
    default: Date.now, // Store the current date and time when the category is created
  },
});

module.exports = mongoose.model("Category", Category);
