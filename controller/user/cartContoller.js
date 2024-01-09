const Cart = require("../../models/cart");
const User = require("../../models/userModel");
const {
  calculateProductTotal,
  calculateSubtotal,
} = require("../../config/cartSum");

const loadCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    if (userData) {
      const userCart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );
      console.log("userCart:", userCart);
      if (userCart) {
        const cart = userCart ? userCart.items : [];
        const subtotal = calculateSubtotal(cart);
        const productTotal = calculateProductTotal(cart);
        const subtotalWithShipping = subtotal;

        let outOfStockError = false;
        if (cart.length > 0) {
          for (const cartItem of cart) {
            const product = cartItem.product;
            if (product.quantity < cartItem.quantity) {
              outOfStockError = true;
              break;
            }
          }
        }
        let maxQuantityErr = false;
        if (cart.length > 0) {
          for (const cartItem of cart) {
            const product = cartItem.product;
            if (cartItem.quantity > 2) {
              maxQuantityErr = true;
              break;
            }
          }
        }
        res.render("cart", {
          userData,
          productTotal,
          subtotalWithShipping,
          outOfStockError,
          maxQuantityErr,
          cart,
        });
      } else {
        res.render("cart", { userData, cart: null });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addTocart = async (req, res) => {
  try {
    console.log("in the add to cart");

    const userId = req.session.user_id;
    const product_Id = req.query.id;
    console.log(product_Id);
    const qty = 1;
    const existingCart = await Cart.findOne({ user: userId });
    let newCart = {};

    if (existingCart) {
      console.log("exist");
      const existingCartItem = existingCart.items.find(
        (item) => item.product.toString() === product_Id
      );

      if (existingCartItem) {
        existingCartItem.quantity += parseInt(qty);
      } else {
        existingCart.items.push({
          product: product_Id,
          quantity: parseInt(qty),
        });
      }

      existingCart.total = existingCart.items.length; // Count of items

      await existingCart.save();
    } else {
      console.log("new");
      newCart = new Cart({
        user: userId,
        items: [{ product: product_Id, quantity: parseInt(qty) }],
        total: parseInt(qty, 10),
      });

      await newCart.save();
    }

    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
  }
};

const updateCartCount = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.query.productId;
    const newQuantity = parseInt(req.query.quantity);
    const existingCart = await Cart.findOne({ user: userId });
    if (existingCart) {
      const existingCartItem = existingCart.items.find(
        (item) => item.product.toString() === productId
      );
      if (existingCartItem) {
        existingCartItem.quantity = newQuantity;
        existingCart.total = existingCart.items.reduce(
          (total, item) => total + (item.quantity || 0),
          0
        );
        await existingCart.save();
      }
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Cart not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.query.productId;
    const existingCart = await Cart.findOne({ user: userId });
    if (existingCart) {
      const updatedItems = existingCart.items.filter(
        (item) => item.product.toString() !== productId
      );
      existingCart.items = updatedItems;
      existingCart.total = updatedItems.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );
      await existingCart.save();
      res.json({ success: true, toaster: true });
    } else {
      res.json({ success: false, error: "Cart not found" });
    }
  } catch (error) {
    console.error("Error removing cart item:", error);
  }
};

module.exports = {
  loadCart,
  addTocart,
  updateCartCount,
  removeFromCart,
};
