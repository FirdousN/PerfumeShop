const User = require("../../models/userModel");
const Address = require("../../models/address");

const loadAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    console.log("userData:", userId);

    if (userData) {
      const address = await Address.find({ user: userId });
      res.render("dashboard", { userData, address });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadaddAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    console.log("userData1:", userData);
    // if(userData){
    //     res.render('addAddress',{userData})
    // }else{
    //     res.redirect('/login')
    res.render("addAddress", { userData });
    // }
  } catch (error) {
    console.log(error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { houseName, street, city, state, pincode } = req.body;

    const address = new Address({
      user: userId,
      houseName,
      street,
      city,
      state,
      pincode,
      is_listed: true,
    });
    const addressData = await address.save();
    res.redirect("/address");
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    const id = req.query.id;
    const address = await Address.findById(id);
    console.log("Address:", address);
    res.render("editAddress", { userData, address: address });
  } catch (error) {
    console.log(error.message);
  }
};

const editAddress = async (req, res) => {
  try {
    const id = req.body.address_id;
    const { houseName, street, city, state, pincode } = req.body;
    const updateData = await Address.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          houseName,
          street,
          city,
          state,
          pincode,
          is_listed: true,
        },
      }
    );
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const addressData = await Address.findByIdAndDelete(
      { _id: id }
      // {
      //     $set: {
      //         is_listed : false,
      //     }
      // }
    );
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadAddress,
  loadaddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
};
