const User = require("../../models/userModel");
const Category = require("../../models/category");
const { deleteAndaddProduct } = require("./adminController");

const loadCategory = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    let categoryData; // Declare categoryData only once
    let totalCount;

    if (req.query.search) {
      const search = req.query.search;
      console.log("search:", search);

      categoryData = await Category.find({
        is_listed: true,
        $or: [{ name: { $regex: new RegExp(search, "i") } }],
      });

      totalCount = await Category.countDocuments({
        is_listed: true,
        $or: [{ name: { $regex: new RegExp(search, "i") } }],
      });
    } else {
      categoryData = await Category.find();
      totalCount = await Category.countDocuments();
    }

    const totalPages = Math.ceil(totalCount / limit);

    res.render("category", {
      admin: userData,
      category: categoryData,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategoryform = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    const categoryData = await Category.find();
    res.render("addCategory", { admin: userData, category: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    const newCategory = {
      name: req.body.name,
      image: req.file.filename,
      description: req.body.description,
      is_listed: true,
    };
    const existCategory = await Category.findOne({
      $or: [
        { name: newCategory.name },
        { name: newCategory.name.toLowerCase() },
        { name: newCategory.name.toUpperCase() },
      ],
    });
    console.log("Existing Category:", existCategory);
    if (existCategory) {
      res.render("addCategory", {
        admin: userData,
        message: "This category already exist!",
      });
    } else {
      const category = new Category({
        name: newCategory.name,
        image: newCategory.image,
        description: newCategory.description,
        is_listed: true,
      });
      const categoryData = await category.save();
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: req.session.admin_id });
    const categoryData = await Category.findById({ _id: id });
    if (categoryData) {
      res.render("edit-category", { admin: userData, category: categoryData });
    } else {
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateCategory = async (req, res) => {
  try {
    if (!req.file) {
      const categoryData = await Category.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            name: req.body.name,
            description: req.body.description,
          },
        }
      );
    } else {
      const categoryData = await Category.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            name: req.body.name,
            image: req.file.filename,
            description: req.body.description,
          },
        }
      );
    }
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAndaddCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findById(id);
    if (categoryData.is_listed) {
      await Category.updateOne(
        { _id: id },
        {
          $set: {
            is_listed: false,
          },
        }
      );
      // res.status(200).json({ success: true, message: 'Category unlisted'})
      res.redirect("/admin/category");
    } else {
      await Category.updateOne(
        { _id: id },
        {
          $set: {
            is_listed: true,
          },
        }
      );
      // res.status(200).json({ success: true , message: 'Category listed' })
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadCategory,
  addCategoryform,
  addCategory,
  editCategory,
  updateCategory,
  deleteAndaddCategory,
};
