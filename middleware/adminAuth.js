const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.admin_id });

    if (req.session.admin_id && userData.is_admin == 1) {
      next();
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.admin_id });
    if (req.session.user_id && userData.is_admin == 1) {
      res.redirect("/admin/home");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
