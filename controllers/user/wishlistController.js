const Wishlist = require("../../models/wishListSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log("Session in loadWishlist:", req.session);
    console.log("User ID:", userId);

    if (!userId) {
      return res.redirect("/login");
    }

    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: "products.productId",
        model: "Product",
        populate: [
          { path: "category", model: "Category" },
          { path: "brand", model: "Brand" },
        ],
      })
      .lean();

    console.log("Wishlist:", JSON.stringify(wishlist, null, 2)); // Debug
    res.render("wishlist", { wishlist: wishlist ? wishlist.products : [] });
  } catch (error) {
    console.error("Error loading wishlist:", error);
    res.status(500).send("Internal Server Error");
  }
};

const addToWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "User not logged in",
        redirect: "/login",
      });
    }

    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user session",
        redirect: "/login",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    const isProductInWishlist = wishlist.products.some(
      (item) => item.productId && item.productId.toString() === productId
    );

    if (isProductInWishlist) {
      return res.status(200).json({ success: false, message: "Product already in wishlist" });
    }

    wishlist.products.push({ productId });
    await wishlist.save();

    return res.status(200).json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    console.error("Error in addToWishlist:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not logged in" });
    }
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const result = await Wishlist.updateOne(
      { userId },
      { $pull: { products: { productId } } }
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ success: true, message: "Product removed from wishlist" });
    } else {
      return res.status(404).json({ success: false, message: "Product not found in wishlist" });
    }
  } catch (error) {
    console.error("Error in removeFromWishlist:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
};