const Address = require("../../models/address");
const User = require("../../models/userModel");
const Cart = require("../../models/cart");
const Order = require("../../models/order");
const Product = require("../../models/product");
const Coupon = require("../../models/coupon");
const Wallet = require("../../models/wallet");
const Razorpay = require("razorpay");

const {
  calculateProductTotal,
  calculateSubtotal,
  calculateDiscountedTotal,
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
    if (userData) {
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

    const currentDate = new Date();
    const coupon = await Coupon.find({
      expiry: { $gt: currentDate },
      is_listed: true,
    }).sort({ createdDate: -1 });
    console.log("coupon:", coupon);
    console.log("Address:", addressData);
    res.render("checkout", {
      userData,
      addressData,
      cart: cartItems,
      cartData: cart,
      productTotal,
      subtotalWithShipping,
      coupon,
    });
  }else{
    res.redirect('/login')
  }
  } catch (error) {
    console.error("Error fetching user data and addresses :");
  }
};

const razorpayOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { address, paymentMethod, couponCode } = req.body;
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
    totalAmount = cartItems.reduce(
      (acc, item) => acc + (item.product.discountPrice * item.quantity || 0),
      0
    );
    totalAmount = cartItems.reduce((acc, item) => {
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

    console.log(totalAmount, "amount");

    if (couponCode) {
      totalAmount = await applyCoup(couponCode, totalAmount, userId);
    }

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
    console.log("userId", userId);
    const { address, paymentMethod, couponCode } = req.body;
    console.log("req.body:", req.body);
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

    let totalAmount;
    const cartItems = cart.items || [];
    console.log("CartItems:", cartItems);
    totalAmount = cartItems.reduce((acc, item) => {
      console.log("totalAmount:", totalAmount);
      if (
        item.product.price &&
        item.product.discountStatus &&
        new Date(item.product.discountStart) <= new Date() &&
        new Date(item.product.discountEnd) >= new Date()
      ) {
        return acc + (item.product.price * item.quantity || 0);
      } else {
        return acc + (item.product.price * item.quantity || 0);
      }
    }, 0);

    if (couponCode) {
      totalAmount = await applyCoup(couponCode, totalAmount, userId);
      console.log("totalAmount:", totalAmount);
    }

    if (paymentMethod === "Wallet") {
      const walletData = await Wallet.findOne({ user: userId });
      if (totalAmount <= walletData.walletBalance) {
        walletData.walletBalance -= totalAmount;
        walletData.transaction.push({
          type: "debit",
          amount: totalAmount,
        });
        await walletData.save();

        const order = new Order({
          user: userId,
          address: address,
          orderDate: new Date(),
          deliveryDate: new Date(
            new Date().getTime() + 5 * 24 * 60 * 60 * 1000
          ),
          totalAmount: totalAmount,
          coupon: couponCode,
          items: cartItems.map((cartItem) => ({
            product: cartItem.product._id,
            quantity: cartItem.quantity,
            size: cartItem.size,
            price:
              cartItem.product.price &&
              cartItem.product.discountStatus &&
              new Date(cartItem.product.discountStart) <= new Date() &&
              new Date(cartItem.product.discountEnd) >= new Date()
                ? cartItem.product.price
                : cartItem.product.price,
            status: "Confirmed",
            paymentMethod: paymentMethod,
            paymentStatus: "success",
          })),
        });
        await order.save();
      } else {
        return res
          .status(500)
          .json({ success: false, error: "insufficient balance. " });
      }
    } else if (paymentMethod === "onlinePayment") {
      const order = new Order({
        user: userId,
        address: address,
        coupon: couponCode,
        orderDate: new Date(),
        deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
        totalAmount: req.body.amount,
        items: cartItems.map((cartItem) => ({
          product: cartItem.product._id,
          quantity: cartItem.quantity,
          // size: cartItem.size,
          price:
            cartItem.product.discountPrice &&
            cartItem.product.discountStatus &&
            new Date(cartItem.product.discountStart) <= new Date() &&
            new Date(cartItem.product.discountEnd) >= new Date()
              ? cartItem.product.discountPrice
              : cartItem.product.price,
          status: "Confirmed",
          paymentMethod: "Online Payment",
          paymentStatus: "success",
        })),
      });
      await order.save();
    } else if (paymentMethod === "CashOnDelivery") {
      console.log("inside CashOnDelivery");
      const order = new Order({
        user: userId,
        address: address,
        orderDate: new Date(),
        deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
        totalAmount: totalAmount,
        coupon: couponCode,
        items: cartItems.map((cartItem) => ({
          product: cartItem.product._id,
          quantity: cartItem.quantity,
          // size: cartItem.size,

          price:
            cartItem.product.discountPrice &&
            cartItem.product.discountStatus &&
            new Date(cartItem.product.discountStart) <= new Date() &&
            new Date(cartItem.product.discountEnd) >= new Date()
              ? cartItem.product.discountPrice
              : cartItem.product.price,
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
    console.log(error);
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
    const userData = await User.findById(userId);
    if (userData) {
      const orderId = req.params.id;
      const order = await Order.find()
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
      console.log("Orderid:", order);

      res.render("order", { userData, order });
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message);
  }
};

const orderCancel = async (req, res) => {
  try {
    console.log("Hoooooi");
    const orderId = req.query.id;
    const { reason, productId } = req.body;
    console.log("orderID:", orderId);
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

    const user_id = order.user._id;
    let totalAmount = order.totalAmount;
    const product = order.items.find(
      (item) => item.product._id.toString() === productId
    );

    const couponData = await Coupon.findOne({ code: order.coupon });
    console.log("CouponData:", couponData);
    if (product && product.product) {
      if (product.status === "Confirmed") {
        product.product.sizes.forEach((size) => {
          if (size.size === product.size.toString()) {
            size.stock += product.quantity;
          }
        });
        await product.product.save();
      }
      if (
        product.paymentMethod === "Wallet" ||
        product.paymentMethod === "Online Payment"
      ) {
        const walletData = await Wallet.findOne({ user: user_id });
        if (walletData) {
          walletData.walletBalance +=
            product.price * product.quantity -
            (product.price *
              product.quantity *
              (couponData?.discount ? couponData.discount : 0)) /
              100;
          walletData.transaction.push({
            type: "credit",
            amount:
              product.price * product.quantity -
              (product.price *
                product.quantity *
                (couponData?.discount ? couponData.discount : 0)) /
                100,
          });
          await walletData.save();
        } else {
          const wallet = new Wallet({
            user: user_id,
            transaction: [
              {
                type: "credit",
                amount:
                  product.price * product.quantity -
                  (product.price *
                    product.quantity *
                    (couponData?.discount ? couponData.discount : 0)) /
                    100,
              },
            ],
            walletBalance:
              product.price * product.quantity -
              (product.price *
                product.quantity *
                (couponData?.discount ? couponData.discount : 0)) /
                100,
          });
          await wallet.save();
        }
        product.paymentStatus = "Refunded";
      } else {
        product.paymentStatus = "Declined";
      }
      product.status = "Cancelled";
      product.reason = reason;
      totalAmount =
        totalAmount -
        (product.price * product.quantity -
          (product.price *
            product.quantity *
            (couponData?.discount ? couponData.discount : 0)) /
            100);
    }

    // Update the 'items' array separately
    const updatedItems = order.items.map((item) => {
      if (item.product._id.toString() === productId) {
        item.status = "Cancelled";
      }
      return item;
    });

    const updateData = await Order.findByIdAndUpdate(
      orderId,
      { $set: { items: updatedItems, totalAmount } },
      { new: true }
    );

    if (updateData) {
      console.log("Order cancelled successfully:", updateData);
      res.redirect("/order");
    } else {
      console.log("Order not found.");
      res.status(500).json({
        error: "An error occurred while cancelling the order",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: "An error occurred while processing the request",
    });
  }
};

const returnData = async (req, res) => {
  try {
    const orderId = req.query.id;
    const { reason, productId } = req.body;
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
    const couponData = await Coupon.findOne({ code: order.coupon });
    const user_id = order.user._id;
    let totalAmount = order.totalAmount;
    const product = order.items.find(
      (item) => item.product._id.toString() === productId
    );

    // if (product && product.product) {
    //   if (!Array.isArray(product.product.sizes)) {
    //     if (product.status === "Delivered") {
    //       product.product.sizes.forEach((size) => {
    //         if (size.size === product.size.toString()) {
    //           size.stock += product.quantity;
    //         }
    //       });
    //       await product.product.save();
    //     }
    //   } else {
    //     // Handle the case where product.product.sizes is not an array
    //     console.error("product.product.sizes is not an array");
    //   }
    // }

    const walletData = await Wallet.findOne({ user: user_id });
    if (walletData) {
      walletData.walletBalance +=
        product.price * product.quantity -
        (product.price * product.quantity * (couponData.discount || 0)) / 100;
      walletData.transaction.push({
        type: "credit",
        amount:
          product.price * product.quantity -
          (product.price * product.quantity * (couponData.discount || 0)) / 100,
      });
      await walletData.save();
    } else {
      const wallet = new Wallet({
        user: user_id,
        transaction: [
          {
            type: "credit",
            amount:
              product.price * product.quantity -
              (product.price * product.quantity * (couponData.discount || 0)) /
                100,
          },
        ],
        walletBalance:
          product.price * product.quantity -
          (product.price * product.quantity * (couponData.discount || 0)) / 100,
      });
      await wallet.save();
    }
    product.status = "Returned";
    product.paymentStatus = "Refunded";
    product.reason = reason;
    totalAmount =
      totalAmount -
      product.price * product.quantity -
      (product.price * product.quantity * (couponData.discount || 0)) / 100;

    await order.save();
    res.status(200).json({ success: true, message: "return successful!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    console.log("couponCode:", couponCode);
    const userId = req.session.user_id;
    const coupon = await Coupon.findOne({ code: couponCode });
    let errorMessage;

    if (!coupon) {
      errorMessage = "Coupon not found";
      return res.json({ errorMessage });
    }

    const currentDate = new Date();
    if (coupon.expiry && currentDate > coupon.expiry) {
      errorMessage = "Coupon Expired";
      return res.json({ errorMessage });
    }

    if (coupon.usersUsed.length >= coupon.limit) {
      errorMessage = "Coupon limit Reached";
      return res.json({ errorMessage });
    }

    // if(coupon.usersUsed.includes(userId)){
    //   errorMessage = "You already used this coupon"
    //   return res.json({ errorMessage })
    // }

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        model: "Product",
      })
      .exec();

    const cartItems = cart.items || [];
    const orderTotal = calculateSubtotal(cartItems);

    if (coupon.minAmt > orderTotal) {
      errorMessage = "The amount is less than minimum amount";
      return res.json({ errorMessage });
    }

    let discountedTotal = 0;
    discountedTotal = calculateDiscountedTotal(orderTotal, coupon.discount);

    if (coupon.maxAmt < discountedTotal) {
      errorMessage =
        "The Discount can't be applied. It is beyond maximum amount";
      return res.json({ errorMessage });
    }
    discountedTotal = await applyCoup(couponCode, discountedTotal, userId);
    console.log("1 discountedTotal: ", discountedTotal);
    res.json({ discountedTotal });
  } catch (error) {
    res.status(500).json({ errorMessage: "Internal Server Error" });
  }
};

//apply coupon function
async function applyCoup(couponCode, discountedTotal, userId) {
  const coupon = await Coupon.findOne({ code: couponCode });
  if (!coupon) {
    return discountedTotal;
  }

  const currentDate = new Date();
  if (currentDate > coupon.expiry) {
    return discountedTotal;
  }
  if (coupon.usersUsed.length >= coupon.limit) {
    return discountedTotal;
  }

  if (coupon.usersUsed.includes(userId)) {
    return discountedTotal;
  }

  discountedTotal = calculateDiscountedTotal(discountedTotal, coupon.discount);
  console.log("Discountedtotal:", discountedTotal);
  coupon.limit--;
  coupon.usersUsed.push(userId);
  await coupon.save();
  return discountedTotal;
}

module.exports = {
  loadCheckout,
  razorpayOrder,
  checkOutPost,
  loadOrderDetails,
  loadOrderHistory,
  orderCancel,
  returnData,
  applyCoupon,
};
