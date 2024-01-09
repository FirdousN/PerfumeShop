const User = require("../../models/userModel");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Brand = require("../../models/brand");
// const gender = ["Men", "Women"];
const sharp = require("sharp");
const path = require("path");

const loadProduct = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    let productData = await Product.find();
    const categoryData = await Category.find();
    const brands = await Brand.find();
    console.log("brands:", brands);
    let search = "";
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const totalCount = await Product.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);
    if (req.query.search) {
      search = req.query.search;
      const productData = await Product.find({
        is_listed: true,
        $or: [{ name: { $regex: new RegExp(search, "i") } }],
      })
        .skip((page - 1) * limit)
        .limit(limit);
      res.render("product", {
        admin: userData,
        product: productData,
        category: categoryData,
        brand: brands,
        totalPages,
        currentPage: page,
      });
    }
    res.render("product", {
      admin: userData,
      product: productData,
      category: categoryData,
      brands,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addProductform = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    const categoryData = await Category.find();
    const brands = await Brand.find();
    res.render("addProduct", {
      admin: userData,
      category: categoryData,
      brand: brands,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addProduct = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    const categoryData = await Category.find();

    let imageData = [];

    console.log(req.body);

    const {
      name,
      product_description,
      category,
      price,
      discount_price,
      stock,
      productSize,
      brand,
    } = req.body;
    const sizedata = req.body.sizes;

    if (!name || !category || !brand || !productSize) {
      return res.status(400).render("addProduct", {
        admin: userData,
        errorMessage: "Name, Category, Brand , and size are required.",
        category: categoryData,
      });
    }
    const existProduct = await Product.findOne({ name: name });
    if (existProduct) {
      res.render("addProduct", {
        admin: userData,
        message: "This product already exists",
        category: categoryData,
      });
    } else {
      const product = new Product({
        name: name,
        image: imageData,
        description: product_description,
        category: category,
        price: price,
        discount_price: discount_price,
        stock: stock,
        size: productSize,
        brand: brand,
        is_listed: true,
      });
      const productData = await product.save();
      res.redirect("/admin/product");
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(error.message);
  }
};

const editProductLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: req.session.admin_id });
    const categoryData = await Category.find();
    const brands = await Brand.find();

    const productData = await Product.findById({ _id: id });
    if (productData) {
      res.render("edit-product", {
        admin: userData,
        product: productData,
        category: categoryData,
        brand: brands,
      });
    } else {
      res.redirect("/admin/product");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = req.body.idproduct;
    const productData = await Product.findById({ _id: id });
    console.log(productData);

    const {
      name,
      product_description,
      category,
      price,
      discount_price,
      stock,
      productSize,
      brand,
    } = req.body;

    let images = [],
      del = [];

    if (req.body.deletecheckbox) {
      del.push(req.body.deletecheckbox);
      del = del.flat().map((x) => Number(x));
      images = productData.image.filter((img, idx) => !del.includes(idx));
    } else {
      images = productData.image.map((img) => {
        return img;
      });
    }
    if (req.files.length != 0) {
      for (const file of req.files) {
        console.log(file, "File received");

        const randomInteger = Math.floor(Math.random() * 20000001);
        const imageDirectory = path.join(
          "public",
          "admin-assets",
          "imgs",
          "product"
        );
        const imgFileName = "cropped" + randomInteger + ".jpg";
        const imagePath = path.join(imageDirectory, imgFileName);

        console.log(imagePath, "Image path");

        const croppedImage = await sharp(file.path)
          .resize(300, 320, {
            fit: "cover",
          })
          .toFile(imagePath);
        if (croppedImage) {
          images.push(imgFileName);
        }
      }
    }
    //     for( let i = 0 ; i < req.files.length ; i++ ){
    //     images.push(req.files[i].filename)
    // }
    console.log("image:", images);
    if (req.body.idproduct) {
      const productData = await Product.findByIdAndUpdate(
        { _id: req.body.idproduct },
        {
          $set: {
            name: name,
            image: images,
            description: product_description,
            category: category,
            price: price,
            discount_price: discount_price,
            stock: stock,
            size: productSize,
            brand: brand,
          },
        }
      );
    } else {
      // const id = req.body.idproduct
      const productData = await Product.findByIdAndUpdate(
        { _id: req.body.idproduct },
        {
          $set: {
            name: name,
            image: images,
            description: product_description,
            category: category,
            price: price,
            discount_price: discount_price,
            stock: stock,
            productSize: productSize,
            sizes: sizedata,
            brand: brand,
          },
        }
      );
    }
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error.message);
  }
};

const listandUnlistProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById(id);
    if (productData.is_listed) {
      await Product.updateOne(
        { _id: id },
        {
          $set: {
            is_listed: false,
          },
        }
      );
      res.redirect("/admin/product");
    } else {
      await Product.updateOne(
        { _id: id },
        {
          $set: {
            is_listed: true,
          },
        }
      );
    }
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadProduct,
  addProductform,
  addProduct,
  editProductLoad,
  updateProduct,
  listandUnlistProduct,
};
