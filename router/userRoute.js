const express = require("express");
const session = require("express-session");
const user_route = express();
const auth = require("../middleware/auth");
const config = require("../config/config");
const multer = require("multer");
const path = require("path");
const userController = require("../controller/user/userController");
const cartController = require("../controller/user/cartContoller");
const orderController = require("../controller/user/uorderContoller");
const addressController = require("../controller/user/addressController");

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
    secret: config.sessionSecret,
    cookie: { secure: false },
  })
);

user_route.get("/register", auth.isLogout, userController.loadRegister);

user_route.post("/register", upload.single("image"), (req, res) => {
  if (req.file) {
    console.log("req.file:", req.file);
    const imageName = req.file.filename;
    userController.insertUser(req, res);
  } else {
    console.log("req.file:", req.file);
    res.status(400).send("No file uploaded");
  }
});

//registration
user_route.get("/register", auth.isLogout, userController.loadRegister);
user_route.post("/register", userController.insertUser);

//login
user_route.get("/", auth.isLogout, userController.loginLoad);
user_route.get("/login", auth.isLogout, userController.loginLoad);
user_route.post("/login", userController.verifyLogin);
user_route.get("/home", auth.isLogin, userController.loadHome);

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
user_route.post("/forgotPassword", userController.forgotPasswordOTP);
user_route.get("/resetPassword", userController.loadResetPassword);
user_route.post("/resetPassword", userController.resetPassword);
user_route.post("/changePassword", userController.resetPassword);

//product
user_route.get("/product", auth.isLogin, userController.product_details);
user_route.get("/shop", auth.isLogin, userController.shop);
// user_route.get('/shopCategoryFilter',userController.loadShopCategory)
// user_route.get('/shopBrandFilter',userController.loadShopBrand)

//cart
user_route.get("/cart", cartController.loadCart);
user_route.post("/cart", cartController.addTocart);
user_route.put("/updateCart", cartController.updateCartCount);
user_route.delete("/removeCartItem", cartController.removeFromCart);

//address
user_route.get("/dashboard", auth.isLogin, userController.loadProfile);
user_route.post("/dashboard", auth.isLogin, userController.updateProfile);
user_route.get("/address", addressController.loadAddress);
user_route.get("/addAddress", addressController.loadaddAddress);
user_route.post("/addAddress", addressController.addAddress);
user_route.get("/editAddress", addressController.loadEditAddress);
user_route.post("/editAddress", addressController.editAddress);
user_route.get("/deleteAddress", addressController.deleteAddress);

//order
user_route.get("/checkout", orderController.loadCheckout);
user_route.post("/checkout", orderController.checkOutPost);
user_route.post("/razorpayOrder", orderController.razorpayOrder);
user_route.get("/order", orderController.loadOrderHistory);
user_route.get("/orderDetails/:id", orderController.loadOrderDetails);
user_route.get("/orderCancel", orderController.orderCancel);
user_route.post("/return", orderController.returnData);

user_route.get("/logout", auth.isLogin, userController.userLogout);

module.exports = user_route;
