const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: Array,
    required: true,
  },
  description: {
    type: String,
  },
  is_listed: {
    type: Boolean,
    default: true,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
