const express = require("express");
const admin_route = express();
const session = require("express-session");
const config = require("../config/config");
// const bodyParser = require("body-parser")
admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));
const multer = require("../middleware/multer");

const auth = require("../middleware/adminAuth");
const adminController = require("../controller/admin/adminController");
const categoryController = require("../controller/admin/categoryController");
const productController = require("../controller/admin/productController");
const brandController = require("../controller/admin/brandController");
const orderController = require("../controller/admin/orderController");

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

admin_route.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: config.sessionSecret,
  })
);

//LOGIN
admin_route.get("/", auth.isLogout, adminController.loadLogin);
admin_route.post("/", adminController.verifyLogin);
admin_route.get("/logout", auth.isLogin, adminController.logout);

//USER
admin_route.get("/new_user", auth.isLogin, adminController.loadNewUser);
admin_route.post(
  "/new_user",
  multer.uploadImage.single("image"),
  adminController.addNewUser
);
admin_route.get("/edit-user", auth.isLogin, adminController.editUser);
admin_route.post("/edit-user", auth.isLogin, adminController.updateUser);
admin_route.get("/delete-user", auth.isLogin, adminController.deleteUser);
admin_route.get("/userManage", auth.isLogin, adminController.loadUserManage);
admin_route.get(
  "/block-unblock_user",
  auth.isLogin,
  adminController.blockAndunblockUser
);

//CATEGORY
admin_route.get("/category", auth.isLogin, categoryController.loadCategory);
admin_route.get(
  "/addCategory",
  auth.isLogin,
  categoryController.addCategoryform
);
admin_route.post(
  "/addCategory",
  auth.isLogin,
  multer.uploadCategory.single("image"),
  categoryController.addCategory
);
admin_route.get(
  "/edit-Category",
  auth.isLogin,
  categoryController.editCategory
);
admin_route.post(
  "/edit-Category",
  auth.isLogin,
  multer.uploadCategory.single("image"),
  categoryController.updateCategory
);
admin_route.get(
  "/delete-add_category",
  auth.isLogin,
  categoryController.deleteAndaddCategory
);

//PRODUCT
admin_route.get("/product", auth.isLogin, productController.loadProduct);
admin_route.get("/addProduct", auth.isLogin, productController.addProductform);
admin_route.post(
  "/addProduct",
  auth.isLogin,
  multer.uploadProduct.array("image"),
  productController.addProduct
);
admin_route.get(
  "/edit-Product",
  auth.isLogin,
  productController.editProductLoad
);
admin_route.post(
  "/edit-Product",
  auth.isLogin,
  multer.uploadProduct.array("image"),
  productController.updateProduct
);
admin_route.get("/delete-add_product",  auth.isLogin, productController.listandUnlistProduct);

//BRAND
admin_route.get("/brand", auth.isLogin, brandController.loadBrand);
admin_route.get("/addBrand", auth.isLogin, brandController.loadBrandform);
admin_route.post(
  "/addBrand",
  auth.isLogin,
  multer.uploadBrand.single("image"),
  brandController.addBrand
);
admin_route.get("/edit-Brand", auth.isLogin, brandController.loadEditBrand);
admin_route.post(
  "/edit-Brand",
  auth.isLogin,
  multer.uploadProduct.single("image"),
  brandController.updateBrand
);
admin_route.get("/listandunlist_brand", auth.isLogin, brandController.unlistBrand);

//ORDER
admin_route.get("/orders", auth.isLogin, orderController.listOrders);
admin_route.get("/orderDetails", auth.isLogin, orderController.orderDetails);
admin_route.put("/orderStatus", auth.isLogin, orderController.orderStatus);
admin_route.get("/salesReport", auth.isLogin, orderController.loadSalesReport);

//HOME
admin_route.get("/dashboard", auth.isLogin, adminController.adminDashboard);
admin_route.get("/home", auth.isLogin, adminController.loadDashboard);

admin_route.use((req, res) => {
  res.status(404).send("Not Found");
});

module.exports = admin_route;