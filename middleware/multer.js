const multer = require("multer");
const path = require("path");
const uuid = require("uuid");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/userImages");
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const storagecategoryImg = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/admin-assets/imgs/category");
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  },
});
const storeproductImg = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/admin-assets/imgs/product");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + uuid.v4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const brandstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/admin-assets/imgs/brand");
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const bannerstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/admin-assets/imgs/banner");
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

module.exports = {
  uploadImage: multer({ storage: storage }),
  uploadCategory: multer({ storage: storagecategoryImg }),
  uploadProduct: multer({ storage: storeproductImg }),
  uploadBrand: multer({ storage: brandstorage }),
  uploadBanner: multer({ storage: bannerstorage }),
};
