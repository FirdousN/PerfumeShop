const Address = require("../../models/address");
const User = require("../../models/userModel");
const Cart = require("../../models/cart");
const Order = require("../../models/order");
const Product = require("../../models/product");
const Razorpay = require("razorpay");

const {
  calculateProductTotal,
  calculateSubtotal,
} = require("../../config/cartSum");

var instance = new Razorpay({
  key_id: "rzp_test_eMaiotsfuGq1Cy",
  key_secret: "MKS4o6iz7SFbLzcq5EMDfL2i",
});

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    console.log("UserId:", userId);
    console.log("UserData:", userData);

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        model: "Product",
      })
      .exec();

    if (!cart) {
      console.log("Cart not found.");
    }
    const cartItems = cart.items || [];
    const subtotal = calculateSubtotal(cartItems);
    const productTotal = calculateProductTotal(cartItems);
    const subtotalWithShipping = subtotal;
    const addressData = await Address.find({ user: userId });
    console.log("Address:", addressData);
    res.render("checkout", {
      userData,
      addressData,
      cart: cartItems,
      productTotal,
      subtotalWithShipping,
    });
  } catch (error) {
    console.error("Error fetching user data and addresses :");
  }
};

const razorpayOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { address, paymentMethod } = req.body;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        model: "Product",
      })
      .populate("user");

    if (!user || !cart) {
      return res
        .status(500)
        .json({ success: false, error: "User or cart not found " });
    }

    if (!address) {
      return res.status(400).json({ error: "Billing address not selected" });
    }

    const cartItems = cart.items || [];
    let totalAmount = 0;
    // totalAmount = cartItems.reduce(
    //   (acc, item) => acc + (item.product.discountPrice * item.quantity || 0), 0
    // )
    totalAmount = cartItems.reduce((acc, item) => {
      const productTotal = item.product.discount_price * item.quantity || 0;
      return acc + productTotal;
    }, 0);
    console.log(totalAmount, "amount");
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
    };

    instance.orders.create(options, async (err, razorpayOrder) => {
      if (err) {
        console.error("Error creating Razorpay order:", err);
        return res
          .status(400)
          .json({ success: false, error: "Payment Failed", user });
      } else {
        res.status(201).json({
          success: true,
          message: "Order placed successfully",
          order: razorpayOrder,
        });
      }
    });
    console.log("done");
  } catch (error) {
    console.error("An error occured while placing order:", error);
    return res.status(400).json({ success: false, error: "Payment Failed" });
  }
};

const checkOutPost = async (req, res) => {
  try {
    const userId = req.session.user_id;
    console.log(userId);
    const { address, paymentMethod } = req.body;
    console.log(req.body);
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        model: "Product",
      })
      .populate("user");

    if (!user || !cart) {
      console.log("no cart user");
      return res
        .status(500)
        .json({ success: false, error: "User or cart not found. " });
    }
    if (!address) {
      console.log("no address");

      return res.status(400).json({ error: "Billing address not selected " });
    }
    const cartItems = cart.items || [];

    // for (const cartItem of cartItems) {
    //   console.log('blaaa');
    //   const product = cartItem.product;
    //   // const sizeToUpdate = product?.size.find(
    //   //   (size) => parseInt(size.size) === parseInt(cartItem.size)
    //   // );
    //   console.log(sizeToUpdate,"sizeToUpdate");
    //   // if (sizeToUpdate && sizeToUpdate.stock >= cartItem.quantity) {
    //   //   product?.size.map((size) => {
    //   //     if (size.size == cartItem.size) {

    //   //       size.stock -= cartItem.quantity;
    //   //     }
    //   //   });
    //   //   await product.save();
    //   // }
    //   // else {
    //   //   return res
    //   //     .status(400)
    //   //     .json({success: false, error: `${product.name} is out of stock.` });
    //   // }
    // }
    console.log("CartItems:", cartItems);
    let totalAmount = cartItems.reduce((acc, item) => {
      if (
        item.product.discountPrice &&
        item.product.discountStatus &&
        new Date(item.product.discountStart) <= new Date() &&
        new Date(item.product.discountEnd) >= new Date()
      ) {
        return acc + (item.product.discountPrice * item.quantity || 0);
      } else {
        return acc + (item.product.price * item.quantity || 0);
      }
    }, 0);
    if (paymentMethod == "onlinePayment") {
      const order = new Order({
        user: userId,
        address: address,
        orderDate: new Date(),
        deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
        totalAmount: req.body.amount,
        items: cartItems.map((cartItem) => ({
          product: cartItem.product._id,
          quantity: cartItem.quantity,

          price: cartItem.product.discountPrice,
          // &&cartItem.product.discountStatus &&new Date(cartItem.product.discountStart) <= new Date() && new Date(cartItem.product.discountEnd) >= new Date()?cartItem.product.discountPrice:cartItem.product.price,
          status: "Confirmed",
          paymentMethod: "Online Payment",
          paymentStatus: "success",
        })),
      });

      await order.save();
    } else if (paymentMethod == "CashOnDelivery") {
      console.log("inside CashOnDelivery");
      const order = new Order({
        user: userId,
        address: address,
        orderDate: new Date(),
        deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
        totalAmount: totalAmount,
        // coupon: couponCode,
        items: cartItems.map((cartItem) => ({
          product: cartItem.product._id,
          quantity: cartItem.quantity,
          // size: cartItem.size,

          price: cartItem.product.discountPrice,
          // &&cartItem.product.discountStatus &&new Date(cartItem.product.discountStart) <= new Date() && new Date(cartItem.product.discountEnd) >= new Date()?cartItem.product.discountPrice:cartItem.product.price,
          status: "Confirmed",
          paymentMethod: paymentMethod,
          paymentStatus: "Pending",
        })),
      });

      await order.save();
    } else {
    }
    cart.items = []; // Clearing items
    cart.totalAmount = 0; // Resetting totalAmount

    await cart.save(); // Save the updated cart

    res
      .status(200)
      .json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.params.id;
    console.log("orderId:", orderId);
    const userData = await User.findById(userId);
    const order = await Order.findOne({ _id: orderId })
      .populate("user")
      .populate({
        path: "items.product",
        model: "Product",
      })
      .populate("address")
      .populate("items");
    console.log("Order:", order);
    if (userData) {
      res.render("orderDetails", { userData, order });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrderHistory = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.params.id;
    const userData = await User.findById(userId);
    const order = await Order.find()
      .populate("user")
      .populate({
        path: "address",
        model: "Address",
      })
      .populate({
        path: "items.product",
        model: "Product",
      });
    console.log("Orderid:", order);

    res.render("order", { userData, order });
  } catch (error) {
    console.log(error.message);
  }
};

const orderCancel = async (req, res) => {
  try {
    const orderId = req.query.id;
    const itemId = req.query.itemId;
    console.log("orderID:", orderId);
    const userId = req.session.user_id;
    const userData = await User.findById(orderId)
      .populate("user")
      .populate({
        path: "address",
        model: "Address",
      })
      .populate({
        path: "items.product",
        model: "Product",
      });
    const updateData = await Order.updateOne(
      { _id: orderId, "items._id": itemId },
      { $set: { "items.$.status": "Cancelled" } }
    );

    if (updateData) {
      console.log("Order cancelled successfully:", updateData);
      res.redirect("/order");
    } else {
      console.log("Order not found.");
      res.status(404).send("Order not found");
    }
    // res.redirect("/order")
  } catch (error) {
    console.log(error.message);
  }
};

const returnData = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  loadCheckout,
  razorpayOrder,
  checkOutPost,
  loadOrderDetails,
  loadOrderHistory,
  orderCancel,
  returnData,
};
