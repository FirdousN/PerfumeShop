const calculateSubtotal = (cart) => {
  console.log(cart, "cart");
  let subtotal = 0;
  for (const cartItem of cart) {
    subtotal += cartItem.product.price * cartItem.quantity;
  }
  return subtotal;
};

const calculateProductTotal = (cart) => {
  const productTotals = [];
  for (const cartItem of cart) {
    const total = cartItem.product.price * cartItem.quantity;
    productTotals.push(total);
  }
  return productTotals;
};

module.exports = {
  calculateSubtotal,
  calculateProductTotal,
};
