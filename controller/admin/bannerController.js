const { trusted } = require("mongoose");
const Banner = require("../../models/banner");
// const slugify = require("slugify");

const loadBanner = async (req, res) => {
  try {
    let admin = req.session.admin;
    let banner = await Banner.find();
    res.render("banner", { admin, banner, is_admin: 1 });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddBanner = async (req, res) => {
  try {
    let admin = req.session.admin;
    res.render("addBanner", { admin, is_admin: 1 });
  } catch (error) {
    console.log(error.message);
  }
};

const addBanner = async (req, res) => {
  try {
    const files = req.files;
    const images = files.map((file) => file.filename);

    let bannerData = req.body;
    console.log(bannerData.bannerName);
    if (
      typeof bannerData.bannerName !== "string" ||
      bannerData.bannerName.trim() === ""
    ) {
      throw new Error("Invalid banner name");
    }
    // bannerData.slug = slugify(bannerData.bannerName, { lower: true });
    // const existingBanner = await Banner.findOne({ slug: bannerData.slug });
    // if (existingBanner) {
    //   throw new Error("Banner with the same slug already exists");
    // }

    const newBanner = new Banner({
      title: bannerData.bannerName,
      image: images,
      // slug: bannerData.slug,
      description: bannerData.description,
      link: bannerData.link,
      offer: bannerData.offer,
    });

    await newBanner.save();
    res.redirect("/admin/banner");
  } catch (error) {
    console.error(error);
    // if (error.message === "Banner with the same slug alreasy exists") {
    //   res.redirect(
    //     "/admin/addBanner?error=" +
    //       encodeURIComponent("Banner with the same slug already exists")
    //   );
    // }
  }
};

const editBanner = async (req, res) => {
  try {
    const admin = req.session.admin;
    const bannerId = req.params.id;
    const banner = await Banner.findById({ _id: bannerId });
    console.log("Banner:", banner);
    res.render("editBanner", { admin, banner, is_admin: 1 });
  } catch (error) {
    console.log(error.message);
  }
};

const updateBanner = async (req, res) => {
  try {
    const updatedData = req.body;
    console.log("updatedData:", updatedData);
    const files = req.files;
    const bannerId = req.params.id;
    console.log("BannerId:", bannerId);
    let images = [];
    if (files && files.length > 0) {
      images = files.map((file) => file.filename);
    }

    const banner = await Banner.findById(bannerId);
    if (banner && banner.image && images.length == 0) {
      images = [banner.image];
    }

    await Banner.findByIdAndUpdate(
      bannerId,
      { $set: { ...updatedData, image: images } },
      { new: true }
    ).exec();
    res.redirect("/admin/banner");
  } catch (error) {
    console.log(error.message);
  }
};

const unlistBanner = async (req, res) => {
  try {
    const id = req.query.id;
    const brand = await Banner.findById(id);
    if (brand.is_listed) {
      const brand = await Banner.updateOne(
        { _id: id },
        {
          $set: {
            is_listed: false,
          },
        }
      );
    } else {
      const brand = await Banner.updateOne(
        { _id: id },
        {
          $set: {
            is_listed: true,
          },
        }
      );
    }
    res.redirect("/admin/banner");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadBanner,
  loadAddBanner,
  addBanner,
  editBanner,
  updateBanner,
  unlistBanner,
};
