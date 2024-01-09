const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");

const Product = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: [
    {
      type: String,
      required: true,
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount_price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  // gender:{
  //     type: String,
  //     required: true,
  // },
  is_listed: {
    type: Boolean,
    required: true,
  },
  productAddDate: {
    type: Date,
    default: Date.now, // Store the current date and time when the product is created
  },
});

Product.plugin(mongoosePaginate);

module.exports = mongoose.model("Product", Product);
