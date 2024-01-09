const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
  const userData = await User.findOne({ _id: req.session.user_id });
  try {
    if (
      req.session.user_id &&
      userData.is_admin == 0 &&
      userData.is_blocked == 0
    ) {
      next();
    } else {
      if (userData.is_blocked == 1) {
        req.session.user_id = null;
        res.render("login", { message: "You are blocked from this site!" });
      } else {
        res.redirect("/");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  const userData = await User.findOne({ _id: req.session.user_id });
  try {
    if (req.session.user_id && userData.is_admin == 0) {
      res.redirect("/home");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
