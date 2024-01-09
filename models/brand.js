const mongoose = require("mongoose");

const Brand = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  is_listed: {
    type: Boolean,
    default: true,
  },
  brandAddDate: {
    type: Date,
    default: Date.now, // Store the current date and time when the product is created
  },
});
module.exports = mongoose.model("Brand", Brand);
