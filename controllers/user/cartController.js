const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");



// Get Cart
const getCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    const cartItems = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "productName productImage sizeVariants",
      model: "Product",
    });

    if (!cartItems) {
      return res.render("cart", {
        cart: null,
        products: [],
        totalAmount: 0,
        user: user,
      });
    }

    const validItems = cartItems.items
      .filter((item) => item.productId != null && item.size && item.totalPrice)
      .map((item) => {
        const variant = item.productId.sizeVariants.find(v => v.size === item.size);
        // Fallback to item.price if variant is missing, then to 0 if item.price is undefined
        const price = variant ? (variant.salePrice ?? variant.regularPrice) : (item.price ?? 0);
        return {
          ...item.toObject(),
          isOutOfStock: variant ? variant.quantity < 1 : true,
          availableStock: variant ? variant.quantity : 0,
          maxAllowedQuantity: Math.min(5, variant ? variant.quantity : 0),
          price: price,
          salePrice: price, // For view compatibility
          originalPrice: variant ? variant.regularPrice : price,
          totalPrice: item.quantity * price,
        };
      });

    const totalAmount = validItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    res.render("cart", {
      cart: cartItems,
      products: validItems,
      totalAmount,
      user: user,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).render("error", {
      message: "Failed to load cart",
    });
  }
};

// Add to Cart
const addToCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, size, quantity = 1 } = req.body;

    console.log('Add to cart request:', { productId, size, quantity });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to add items to your cart.',
        redirect: '/login'
      });
    }

    // Validate inputs
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      console.error('Invalid productId:', productId);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    if (!size || typeof size !== 'string') {
      console.error('Invalid size:', size);
      return res.status(400).json({
        success: false,
        message: 'Size is required'
      });
    }

    const normalizedSize = size.trim().toUpperCase();
    const requestedQuantity = parseInt(quantity);
    if (isNaN(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity'
      });
    }

    // Find the product
    const product = await Product.findById(productId).populate('category');
    if (!product) {
      console.error('Product not found for ID:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the size variant
    const variant = product.sizeVariants.find(v => v.size === normalizedSize);
    if (!variant) {
      console.error('Size not found for product:', {
        productId,
        size: normalizedSize,
        availableSizes: product.sizeVariants.map(v => v.size)
      });
      return res.status(400).json({
        success: false,
        message: `Invalid size selected: ${normalizedSize}`
      });
    }

    // Validate price
    const price = variant.salePrice ?? variant.regularPrice;
    if (!price || isNaN(price) || price <= 0) {
      console.error('Invalid price for product:', { productId, size: normalizedSize, variant });
      return res.status(400).json({
        success: false,
        message: 'Product price is invalid'
      });
    }

    // Validate quantity
    if (variant.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: `Size ${normalizedSize} is out of stock`
      });
    }

    if (requestedQuantity > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 items allowed per product'
      });
    }

    if (requestedQuantity > variant.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.quantity} items available for size ${normalizedSize}`
      });
    }

    // Find or create the cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Clean up invalid items
    cart.items = cart.items.filter(item => item.size && item.totalPrice);

    // Check if the item (with same productId and size) exists
    const existingItem = cart.items.find(
      item => item.productId.toString() === productId &&
             item.size === normalizedSize &&
             item.status === 'placed'
    );

    if (existingItem) {
      return res.status(200).json({
        success: true,
        status: 'already_in_cart',
        message: 'Item is already in your cart'
      });
    }

    // Add new item
    cart.items.push({
      productId,
      size: normalizedSize,
      quantity: requestedQuantity,
      price,
      totalPrice: requestedQuantity * price,
      status: 'placed'
    });

    await cart.save();
    console.log('Cart after:', cart);

    res.json({
      success: true,
      message: 'Product added to cart successfully'
    });
  } catch (error) {
    console.error('Add to cart error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to cart'
    });
  }
};

// Update Quantity
const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, size, quantity } = req.body;

    const requestedQuantity = parseInt(quantity);
    if (isNaN(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 5) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 5",
      });
    }

    const normalizedSize = size.trim().toUpperCase();

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const variant = product.sizeVariants.find(v => v.size === normalizedSize);
    if (!variant) {
      return res.status(400).json({
        success: false,
        message: `Invalid size: ${normalizedSize}`
      });
    }

    if (requestedQuantity > variant.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.quantity} items available for size ${normalizedSize}`
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Clean up invalid items
    cart.items = cart.items.filter(item => item.size && item.totalPrice);

    const cartItem = cart.items.find(
      (item) => item.productId.toString() === productId &&
                item.size === normalizedSize &&
                item.status === "placed"
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Update quantity and prices
    cartItem.quantity = requestedQuantity;
    cartItem.price = variant.salePrice ?? variant.regularPrice;
    cartItem.totalPrice = requestedQuantity * cartItem.price;

    // Calculate new cart total
    const cartTotal = cart.items.reduce((total, item) => {
      if (item.status === "placed") {
        return total + item.totalPrice;
      }
      return total;
    }, 0);

    await cart.save();

    res.status(200).json({
      success: true,
      totalPrice: cartItem.totalPrice,
      cartTotal,
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update quantity",
    });
  }
};

// Remove from Cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, size } = req.body;

    console.log("Removing productId:", productId, "size:", size);

    const normalizedSize = size.trim().toUpperCase();

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Clean up invalid items
    cart.items = cart.items.filter(item => item.size && item.totalPrice);

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId &&
                item.size === normalizedSize
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.json({
      success: true,
      message: "Item removed successfully",
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
};

