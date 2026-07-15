function checkout(cart) {
  // console.log("cart", cart);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  // debugger;
  return total;
}
