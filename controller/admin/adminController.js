const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Order = require("../../models/order");
const {
  getMonthlyDataArray,
  getDailyDataArray,
  getYearlyDataArray,
} = require("../../config/chartData");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
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
      if (passwordMatch && userData.is_admin == 1) {
        req.session.admin_id = userData._id;
        res.redirect("/admin/home");
      } else {
        res.render("login", { message: "Email and password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
    // res.status(500).send("Internal Server Error")
  }
};

const loadDashboard = async (req, res) => {
  try {
    let query = {};
    const adminData = await User.findById(req.session.admin_id);
    const totalRevenue = await Order.aggregate([
      { $match: { "items.status": "Delivered" } },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);
    const totalUsers = await User.countDocuments({ is_blocked: { $ne: 1 } });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const orders = await Order.find()
      .populate("user")
      .limit(10)
      .sort({ orderDate: -1 });
    const monthlyEarnings = await Order.aggregate([
      {
        $match: {
          "items.status": "Delivered",
          orderDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: { _id: null, monthlyAmount: { $sum: "$totalAmount" } },
      },
    ]);
    const totalRevenueValue =
      totalRevenue.length > 0 ? totalRevenue[0].totalAmount : 0;
    const monthlyEarningsValue =
      monthlyEarnings.length > 0 ? monthlyEarnings[0].monthlyAmount : 0;
    const newUsers = await User.find({ is_blocked: { $ne: 1 }, isAdmin: 0 })
      .sort({ date: -1 })
      .limit(5);

    const monthlyDataArray = await getMonthlyDataArray();
    const dailyDataArray = await getDailyDataArray();
    const yearlyDataArray = await getYearlyDataArray();
    const monthlyOrderCounts = monthlyDataArray.map((item) => item.count);
    const dailyOrderCounts = dailyDataArray.map((item) => item.count);
    const yearlyOrderCounts = yearlyDataArray.map((item) => item.count);

    res.render("home", {
      admin: adminData,
      totalRevenue: totalRevenueValue,
      totalOrders,
      totalCategories,
      totalProducts,
      totalUsers,
      orders,
      newUsers,
      monthlyEarningsValue,
      monthlyOrderCounts,
      dailyOrderCounts,
      yearlyOrderCounts,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadNewUser = async (req, res) => {
  try {
    res.render("newUser");
  } catch (error) {
    console.log(error.message);
  }
};

const addNewUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const image = req.file.filename;
    const password = randomstring.generate(8);
    // const userData = req.session.userData

    const spassword = await securePassword(password);

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      image: image,
      password: password,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("new-user", { message: "Something went wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit-user", { user: userData });
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const id = req.body.id;
    if (!id) {
      return res.status(400).json({ error: "User ID is missing." });
    }
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.deleteOne({ _id: id });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const loadUserManage = async (req, res) => {
  try {
    // const userData = await User.findById({ _id:req.session.admin_id })
    const userManageData = await User.find();
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const totalCount = await User.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);
    let search = "";
    console.log("search:", req.query.search);

    if (req.query.search) {
      search = req.query.search;
      console.log("search:", search);
    }
    const userData = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: new RegExp(search, "i") } },
        { email: { $regex: new RegExp(search, "i") } },
        { mobile: { $regex: new RegExp(search, "i") } },
      ],
    })
    .skip((page - 1) * limit)
    .limit(limit);
    res.render("userManage", { users: userData ,totalPages, currentPage: page});

    // res.render('userManage',{ admin: userData, users: userManageData })
  } catch (error) {
    console.log(error.message);
  }
};

const blockAndunblockUser = async (req, res) => {
  try {
    const id = await req.query.id;
    if (!id) {
      throw new Error("User ID is missing or invalid.");
    }
    const userData = await User.findById(id);
    if (!userData) {
      throw new Error("User not found.");
    }
    if (userData.is_blocked == 0) {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            is_blocked: 1,
          },
        }
      );
      res.redirect("/admin/userManage");
    } else {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            is_blocked: 0,
          },
        }
      );
      res.redirect("/admin/userManage");
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Operation Failed" });
  }
};

const adminDashboard = async (req, res) => {
  try {
    
    let search = "";
    console.log("search:", req.query.search);

    if (req.query.search) {
      search = req.query.search;
      console.log("search:", search);
    }
    const userData = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: new RegExp(search, "i") } },
        { email: { $regex: new RegExp(search, "i") } },
        { mobile: { $regex: new RegExp(search, "i") } },
      ],
    })
    
    // const userData = await User.find({ is_admin:0 })
    res.render("dashboard", { users: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.admin_id = null;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  adminDashboard,
  loadUserManage,
  loadNewUser,
  addNewUser,
  editUser,
  updateUser,
  deleteUser,
  blockAndunblockUser,
  logout,
};
