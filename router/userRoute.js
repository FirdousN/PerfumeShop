const express = require("express");
const session = require("express-session");
const user_route = express();
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const userController = require("../controller/user/userController");
const cartController = require("../controller/user/cartContoller");
const orderController = require("../controller/user/uorderContoller");
const addressController = require("../controller/user/addressController");
const couponController = require("../controller/admin/couponController");

user_route.set("view engine", "ejs");
user_route.set("views", "./views/user");

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/userImages"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

user_route.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSIONSECRET,
    cookie: { secure: false },
  })
);

user_route.get("/register", auth.isLogout, userController.loadRegister);

user_route.post(
  "/register",
  auth.isLogout,
  upload.single("image"),
  (req, res) => {
    if (req.file) {
      console.log("req.file:", req.file);
      const imageName = req.file.filename;
      userController.insertUser(req, res);
    } else {
      console.log("req.file:", req.file);
      res.status(400).send("No file uploaded");
    }
  }
);

//registration
user_route.get("/register", auth.isLogout, userController.loadRegister);
user_route.post("/register", auth.isLogout, userController.insertUser);

//login
user_route.get("/", userController.loadHome);
user_route.get("/login", auth.isLogout, userController.loginLoad);
user_route.post("/login", auth.isLogout, userController.verifyLogin);
user_route.get("/home", userController.loadHome);

//otp verification
user_route.get("/verify", auth.isLogout, userController.loadOtp);
user_route.post("/verify", userController.verifyOtp);
user_route.get("/resendotp", auth.isLogout, userController.resendOtp);

//forgotpassword
user_route.get(
  "/forgotPassword",
  auth.isLogout,
  userController.loadForgotPassword
);
user_route.post(
  "/forgotPassword",
  auth.isLogin,
  userController.forgotPasswordOTP
);
user_route.get(
  "/resetPassword",
  auth.isLogin,
  userController.loadResetPassword
);
user_route.post("/resetPassword", auth.isLogin, userController.resetPassword);
user_route.post("/changePassword", auth.isLogin, userController.resetPassword);

//product
user_route.get("/product", userController.product_details);
user_route.get("/shop", userController.shop);

//cart
user_route.get("/cart", cartController.loadCart);
user_route.post("/cart", auth.isLogin, cartController.addTocart);
user_route.put("/updateCart", auth.isLogin, cartController.updateCartCount);
user_route.delete(
  "/removeCartItem",
  auth.isLogin,
  cartController.removeFromCart
);

//address
user_route.get("/dashboard", userController.loadProfile);
user_route.post("/dashboard", auth.isLogin, userController.updateProfile);
user_route.get("/address", auth.isLogin, addressController.loadAddress);
user_route.get("/addAddress", auth.isLogin, addressController.loadaddAddress);
user_route.post("/addAddress", auth.isLogin, addressController.addAddress);
user_route.get("/editAddress", auth.isLogin, addressController.loadEditAddress);
user_route.post("/editAddress", auth.isLogin, addressController.editAddress);
user_route.get("/deleteAddress", auth.isLogin, addressController.deleteAddress);

//coupon
user_route.get("/coupon", auth.isLogin, couponController.userCouponList);
user_route.post("/applyCoupon", orderController.applyCoupon);

//order
user_route.get("/checkout", orderController.loadCheckout);
user_route.post("/checkout", auth.isLogin, orderController.checkOutPost);
user_route.post("/razorpayOrder", auth.isLogin, orderController.razorpayOrder);
user_route.get("/order", orderController.loadOrderHistory);
user_route.get(
  "/orderDetails/:id",
  auth.isLogin,
  orderController.loadOrderDetails
);
user_route.get("/orderCancel", auth.isLogin, orderController.orderCancel);
user_route.get("/orderSuccess", orderController.loadOrderHistory);
user_route.post("/return", auth.isLogin, orderController.returnData);

user_route.get("/invoice/:orderId", auth.isLogin, userController.invoice);

user_route.get("/logout", auth.isLogin, userController.userLogout);

module.exports = user_route;
