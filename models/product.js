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
  },
  sizes: {
    size: String,
    stock: Number,
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
  discountStatus: {
    type: Boolean,
    default: false,
  },
  discount: Number,
  discountStart: Date,
  discountEnd: Date,
});

Product.plugin(mongoosePaginate);

module.exports = mongoose.model("Product", Product);
