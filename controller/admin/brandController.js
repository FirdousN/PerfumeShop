const Brand = require("../../models/brand");

const loadBrandform = async (req, res) => {
  try {
    res.render("addBrand");
  } catch (error) {
    console.log(error.message);
  }
};

const addBrand = async (req, res) => {
  try {
    let { name, description } = req.body;
    let image = "";
    if (req.file) {
      image = req.file.filename;
    }
    console.log("image:", image);
    const existingBrand = await Brand.findOne({ category: name });
    if (existingBrand) {
      res.render("addBrand", {
        error: "Brand with the same name already exists",
        admin: adminData,
      });
    } else {
      const brand = new Brand({
        name: name,
        image: image,
        description: description,
        is_listed: true,
      });
      const brandData = await brand.save();
      res.redirect("/admin/brand");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadBrand = async (req, res) => {
  try {
    const brand = await Brand.find();
    let search = "";
    if (req.query.search) {
      search = req.query.search;
      console.log("search:", search);
      const brandData = await Brand.find({
        is_listed: true,
        $or: [{ name: { $regex: new RegExp(search, "i") } }],
      });
      res.render("brand", { brand, message: "" });
    }
    res.render("brand", { brand, message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditBrand = async (req, res) => {
  try {
    const id = req.query.id;
    const brandData = await Brand.findById(id);
    res.render("edit-brand", { brand: brandData });
  } catch (error) {
    console.log(error.message);
  }
};

const updateBrand = async (req, res) => {
  try {
    let id = req.body.brand_id;

    const existingBrand = await Brand.findOne({
      name: { $regex: new RegExp(`^${req.body.name}$`, "i") },
      _id: { $ne: id }, // Exclude the current category being updated from the search
    });

    if (existingBrand) {
      return res.render("edit-brand", {
        error: "Brand name already exists",
        brand: existingBrand,
      });
    }
    if (!req.file) {
      const brandData = await Brand.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            name: req.body.name,
            description: req.body.description,
          },
        }
      );
    } else {
      const brandData = await Brand.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            name: req.body.name,
            image: req.file.filename,
            description: req.body.description,
          },
        }
      );
    }
    res.redirect("/admin/brand");
  } catch (error) {
    console.log(error.message);
  }
};

const unlistBrand = async (req, res) => {
  try {
    const id = req.query.id;
    const brand = await Brand.findById(id);
    if (brand.is_listed) {
      const brand = await Brand.updateOne(
        { _id: id },
        {
          $set: {
            is_listed: false,
          },
        }
      );
    } else {
      const brand = await Brand.updateOne(
        { _id: id },
        {
          $set: {
            is_listed: true,
          },
        }
      );
    }
    res.redirect("/admin/brand");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadBrandform,
  addBrand,
  loadBrand,
  loadEditBrand,
  updateBrand,
  unlistBrand,
};
