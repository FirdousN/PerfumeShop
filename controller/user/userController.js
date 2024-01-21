const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const message = require("../../config/sms");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Brand = require("../../models/brand");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Banner = require("../../models/banner");
const Wallet = require("../../models/wallet");
const paginate = require("mongoose-paginate");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//user register
const loadRegister = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  const spassword = await securePassword(req.body.password);
  try {
    newUser = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      image: req.file.filename,
      password: req.body.password,
      is_admin: 0,
    };
    const existuser = await User.findOne({ email: newUser.email });
    if (
      !newUser.name ||
      !newUser.email ||
      !newUser.mobile ||
      !newUser.password ||
      /^[a-zA-Z ]+$/.test(newUser.name) == false ||
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(newUser.email) ==
        false ||
      /^\d{10}$/.test(newUser.mobile) == false ||
      newUser.password.length < 8
    ) {
      res.render("register", { errorMessage: "invalid entry" });
    } else if (existuser) {
      res.render("register", { errorMessage: "The user already exists!" });
    } else {
      req.session.userData = newUser;
      res.redirect("/verify");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadOtp = async (req, res) => {
  const userData = req.session.userData;
  const email = userData.email;
  await message.sendVerifyMail(userData.email, req);
  res.render("otp");
};

const resendOtp = async (req, res) => {
  const userData = req.session.userData;
  const email = userData.email;
  res.render("otp");
  await message.sendVerifyMail(email, req);
};

const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const sessionOtp = req.session.otp;
    const userData = req.session.userData;

    const isRegistering = !req.session.user_id;

    console.log("Session OTP:", sessionOtp);
    console.log("Submitted OTP:", otp);

    if (sessionOtp && otp === sessionOtp) {
      if (isRegistering) {
        const secure_password = await securePassword(userData.password);
        const user = new User({
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile,
          image: userData.image,
          password: secure_password,
          is_admin: 0,
          is_blocked: 0,
        });

        const userDataSave = await user.save();

        if (userDataSave) {
          // Registration successful, redirect to login
          res.redirect("/login");
        } else {
          // Registration failed
          res.render("register", { errorMessage: "Registration Failed" });
        }
      } else {
        // Resetting password, redirect to resetPassword
        res.redirect("/resetPassword");
      }
    } else {
      // Incorrect OTP
      res.render("otp", { errorMessage: "The OTP is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//login user methods started

const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (!email || !password) {
      res.render("login", { message: "Please enter both email and password" });
    } else if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch && userData.is_admin == 0) {
        req.session.user_id = userData._id;
        res.status(302).redirect("/home");
      } else {
        res.render("login", { message: "Email and Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and Password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadForgotPassword = async (req, res) => {
  try {
    req.session.forgotPassword = true;
    res.render("forgotPassword");
  } catch (error) {
    console.log(error.message);
  }
};

const forgotPasswordOTP = async (req, res) => {
  try {
    const email = req.body.email;
    console.log("Email received: ", email);

    const userExist = await User.findOne({ email: email });
    req.session.userData = userExist;
    req.session.user_id = userExist._id;
    console.log("userExist:", userExist);
    if (userExist) {
      const data = await message.sendVerifyMail(userExist.email, req);
      res.render("otp");
    } else {
      res.render("forgotPassword", { error: "Attempt Failed", user: null });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadResetPassword = async (req, res) => {
  try {
    if (req.session.user_id) {
      const userId = req.session.user_id;
      console.log("id:", userId);
      const user = await User.findById(userId);

      res.render("resetPassword", { User: user });
    } else {
      res.redirect("/forgotPassword");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const password = req.body.password;
    const secure_password = await securePassword(password);
    console.log("password:", secure_password);
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      {
        $set: {
          password: secure_password,
        },
      }
    );
    if (updatedData) {
      res.render("login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const productData = await Product.find()
      .populate("category")
      .populate("brand");
    const brandIds = productData.map((product) => product.brand);
    const brands = await Brand.find({ _id: { $in: brandIds } });
    const order = await Order.find();
    const banner = await Banner.find();
    console.log(banner);
    if(userData){
    res.render("home", {
      user: userData,
      products: productData,
      order,
      brands,
      banner,
    });
  }else{
    res.render("home", {
      user: null,
      products: productData,
      order,
      brands,
      banner,
    });
  }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.user_id = null;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const loadProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    const address = await Address.find();
    const orders = await Order.find();
    const wallet = await Wallet.findOne({ user: userId }).populate({
      path: "transaction",
    });
    console.log("Wallet:", wallet);
    if (userData) {
      res.render("dashboard", { userData, address, orders, wallet });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    let id = req.body.user_id;

    const userData = await User.findById(id);

    const { name, email, mobile, password } = req.body;
    const secure_password = await securePassword(password);

    if (!req.file) {
      const updateData = await User.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            name,
            email,
            mobile,
            password: securePassword,
          },
        }
      );
    } else {
      const updateData = await User.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            name,
            email,
            mobile,
            password: securePassword,
            //   image: req.file.filename,
          },
        }
      );
    }
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const shop = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    console.log(brandData);

    const listedCategories = await Category.find({ is_listed: true });
    const listedBrands = await Brand.find({ is_listed: true });

    let search = "";

    if (req.query.search) {
      search = req.query.search;
      console.log("search:", search);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const totalCount = await Product.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);
    const productData = await Product.find({
      category: { $in: listedCategories.map((cat) => cat._id) },
      brand: { $in: listedBrands.map((brand) => brand._id) },
      is_listed: true,
      $or: [{ name: { $regex: new RegExp(search, "i") } }],
    })
      .populate("category")
      .populate("brand")
      .skip((page - 1) * limit)
      .limit(limit);
    if (!userData) {
      console.log("User data not found for user ID:", userId);
      return res.status(404).send("User Not Found");
    }
    res.render("shop", {
      user: userData,
      product: productData,
      category: categoryData,
      brand: brandData,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const product_details = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    const productId = req.query.id;
    const product = await Product.findById(productId)
      .populate("category")
      .populate("brand");
    const category = await Category.find();
    console.log(userId, userData, productId, product, category);
    console.log("product:", productId, product);
    res.render("product", {
      user: userData,
      product: product,
      category: category,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const invoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const order = await Order.findById(orderId)
      .populate({
        path: "items.product",
        model: "Product",
      })
      .populate("items")
      .populate("user")
      .populate("address");
    console.log("Order:", order);
    if (!order) {
      // Handle the case where the order is not found
      return res.status(404).send("Order not found");
    }

    res.render("invoice", { order });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  loadProfile,
  updateProfile,
  loadHome,
  userLogout,
  loadOtp,
  resendOtp,
  verifyOtp,
  loadForgotPassword,
  forgotPasswordOTP,
  loadResetPassword,
  resetPassword,
  shop,
  product_details,
  invoice,
  // loadShopCategory,
  // loadShopBrand
  // listItems
};
