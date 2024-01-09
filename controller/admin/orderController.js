const Order = require("../../models/order");
const Address = require("../../models/address");
const User = require("../../models/userModel");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const dateFun = require("../../config/dateData");
// const { default: items } = require("razorpay/dist/types/items")

const listOrders = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const totalCount = await Product.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);
    const orders = await Order.find()
      .populate("user")
      .populate({
        path: "address",
        model: "Address",
      })
      .populate({
        path: "items.product",
        model: "Product",
      })
      .skip((page - 1) * limit)
      .limit(limit);
    console.log(orders, "akkkkkk");
    res.render("order", { order: orders, totalPages, currentPage: page });
  } catch (error) {
    console.log(error.message);
  }
};

const orderDetails = async (req, res) => {
  try {
    const orderId = req.query.id;
    console.log(orderId, "aakkkdfkfkk");
    const order = await Order.findById(orderId)
      .populate("user")
      .populate({
        path: "address",
        model: "Address",
      })
      .populate({
        path: "items.product",
        model: "Product",
      });
    console.log(order, "akkakakksjjds");
    res.render("orderDetails", { order });
  } catch (error) {
    console.log(error.message);
  }
};

const orderStatus = async (req, res) => {
  try {
    console.log("startttttt");
    const orderId = req.query.id;
    const { status, productId } = req.body;
    console.log(orderId, status, "kkkkkkkkk");
    const order = await Order.findOne({ _id: orderId })
      .populate("user")
      .populate({
        path: "address",
        model: "Address",
      })
      .populate({
        path: "items.product",
        model: "Product",
      });

    const product = order.items.find(
      (item) => item.product._id.toString() === productId
    );

    if (product) {
      product.status = status;
      if (product.status == "Delivered") product.paymentStatus = "success";
    }

    const updateData = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          items: order.items,
        },
      },
      { new: true }
    );
    console.log("Changed");
    return res
      .status(200)
      .json({ success: true, message: "Order status change successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while change status the order" });
  }
};

const loadSalesReport = async (req, res) => {
  let query = {};
  if (req.query.status) {
    if (req.query.status === "Daily") {
      query.orderDate = dateFun.getDailyDateRange();
    } else if (req.query.status === "Weekly") {
      query.orderDate = dateFun.getWeeklyDateRange();
    } else if (req.query.status === "Monthly") {
      query.orderDate = dateFun.getMonthlyDateRange();
    } else if (req.query.status === "Yearly") {
      query.orderDate = dateFun.getYearlyDateRange();
    } else if (req.query.status === "All") {
      query["items.status"] = "Delivered";
    }
  }
  query["items.status"] = "Delivered";

  try {
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .populate("user")
      .populate({
        path: "address",
        model: "Address",
      })
      .populate({
        path: "items.product",
        model: "Product",
      })
      .sort({ orderDate: -1 });
    console.log("Orders:", orders);
    const totalRevenue = orders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    console.log("totalRevenue", totalRevenue);
    const totalSales = orders.length;
    const totalProductsSold = orders.reduce(
      (acc, order) => acc + order.items.length,
      0
    );
    console.log("totalProductsSold", totalProductsSold);
    res.render("salesReport", {
      orders,
      totalRevenue,
      totalSales,
      totalProductsSold,
      req,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Error fetching orders");
  }
};

module.exports = {
  listOrders,
  orderDetails,
  orderStatus,
  loadSalesReport,
};
