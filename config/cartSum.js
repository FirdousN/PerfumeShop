const calculateSubtotal = (cart) => {
  console.log(cart, "cart");
  let subtotal = 0;
  for (const cartItem of cart) {
    const isDiscounted = cartItem.product.discountStatus &&
    new Date(cartItem.product.discountStart) <= new Date() &&
    new Date(cartItem.product.discountEnd) >= new Date() 

    const priceToConsider = isDiscounted ? cartItem.product.price : cartItem.product.price

    subtotal += priceToConsider * cartItem.quantity;
  }
  return subtotal;
};

const calculateProductTotal = (cart) => {
  const productTotals = [];
  for (const cartItem of cart) {
    const isDiscounted = cartItem.product.discountStatus &&
    new Date(cartItem.product.discountStart) <= new Date() &&
    new Date(cartItem.product.discountEnd) >= new Date() 

    const priceToConsider = isDiscounted ? cartItem.product.price : cartItem.product.price

    
    const total = priceToConsider * cartItem.quantity;
    console.log(total);
    productTotals.push(total);
  }
  return productTotals;
};

function calculateDiscountedTotal(total, discountPercentage){
  if(discountPercentage < 0 || discountPercentage > 100){
    throw new Error ('Discount percentage must be between 0 and 100')
  }
  const discountAmount = (discountPercentage / 100) * total
  const discountedTotal = total - discountAmount
  return discountedTotal
}


module.exports = {
  calculateSubtotal,
  calculateProductTotal,
  calculateDiscountedTotal
};
