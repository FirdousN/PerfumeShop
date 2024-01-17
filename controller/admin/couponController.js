const Coupon = require("../../models/coupon");
const User = require("../../models/userModel");

const loadCouponList = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    const page = parseInt(req.query.page);
    let query = {};
    const limit = 7;
    const totalCount = await Coupon.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const coupon = await Coupon.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdDate: -1 });
    console.log("Coupon:", coupon);
    res.render("coupon", { coupon, admin, totalPages, currentPage: page });
  } catch (error) {
    console.log(error.message);
  }
};

const loadCouponAdd = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    res.render("addCoupon", { admin });
  } catch (error) {
    console.log(error.message);
  }
};

const addCoupon = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    let { coupon_code, discount, limit, minAmt, maxAmt, expiryDate } = req.body;

    coupon_code = coupon_code.replace(/\s/g, "");
    console.log("req.body", req.body);
    const existingCoupon = await Coupon.findOne({
      code: { $regex: new RegExp("^" + coupon_code, "i") },
    });
    if (existingCoupon) {
      return res
        .status(500)
        .json({ success: false, error: "Coupon code already exists!" });
    }
    const newCoupon = new Coupon({
      code: coupon_code,
      discount: discount,
      limit: limit,
      expiry: expiryDate,
      maxAmt: maxAmt,
      minAmt: minAmt,
    });
    console.log("NewCoupon", newCoupon);
    await newCoupon.save();
    res
      .status(200)
      .json({ success: true, message: "Coupon Added Successfully" });
  } catch (error) {
    console.error(error);
    res.status(200).json({ success: false, message: "Failed to add Coupon" });
  }
};

const loadEditCoupon = async (req, res) => {
  try {
    const admin = req.session.admin_id;
    const couponId = req.query.couponId;
    const coupon = await Coupon.findById(couponId);
    const expiry = new Date(coupon.expiry).toISOString().split("T")[0];
    res.render("editCoupon", { admin, coupon, expiry });
  } catch (error) {
    console.log(error.message);
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.query.couponId;
    let { coupon_code, discount, limit, minAmt, maxAmt, expiryDate } = req.body;
    if (!coupon_code || !discount || !expiryDate) {
      return res
        .status(400)
        .json({ success: false, error: "Required fields missing" });
    }

    const existingCoupon = await Coupon.findOne({
      code: { $regex: new RegExp("^" + coupon_code, "i") },
      _id: { $ne: couponId },
    });

    if (existingCoupon) {
      return res
        .status(400)
        .json({ success: false, error: "Coupon code already exists!" });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      { _id: couponId },
      {
        $set: {
          code: coupon_code,
          discount: discount,
          limit: limit,
          expiry: expiryDate,
          maxAmt: maxAmt,
          minAmt: minAmt,
        },
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return res
        .status(404)
        .json({ success: false, error: "Coupon not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: " Coupon updated successfully",
        data: updatedCoupon,
      });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: "Failed to update coupon" });
  }
};

const unlistCoupon = async (req, res) => {
  try {
    const id = req.query.couponId;
    const couponData = await Coupon.findById({ _id: id });

    if (couponData.is_listed == false) {
      couponData.is_listed = true;
    } else {
      couponData.is_listed = false;
    }
    await couponData.save();
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error.message);
  }
};

const couponDetails = async (req, res) => {
  try {
    const admin = req.session.adminData;
    const couponId = req.query.couponId;
    const coupon = await Coupon.findById(couponId)
      .populate("usersUsed")
      .sort({ _id: -1 })
      .exec();
    const users = coupon.usersUsed;
    res.render("couponDetails", { users, coupon, admin: admin });
  } catch (error) {
    console.log(error.message);
  }
};

const userCouponList = async (req, res) => {
  try {
    const currentDate = new Date();
    const userId = req.sessiob.user_id;
    const userData = await User.findById(userId);
    if (userData) {
      const coupon = await Coupon.find({
        expiry: { $gt: currentDate },
        is_listed: true,
      }).sort({ createdDate: -1 });
      res.render("coupon", { coupon, userData });
    }
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = {
  loadCouponList,
  loadCouponAdd,
  addCoupon,
  loadEditCoupon,
  editCoupon,
  unlistCoupon,
  couponDetails,
  userCouponList,
};
