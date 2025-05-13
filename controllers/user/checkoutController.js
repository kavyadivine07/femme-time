const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require('../../models/orderSchema');

const mongoose = require('mongoose');

// Get Checkout Page
const getcheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect("/login");
        }

        // Fetch user data
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect("/login");
        }

        const productId = req.query.id || null;
        const quantity = parseInt(req.query.quantity) || 1;

        const address = await Address.findOne({ userId: user._id });
        const addressData = address || { address: [] };

        if (!productId) {
            // Handle cart checkout
            const cart = await Cart.findOne({ userId: user._id }).populate(
                "items.productId"
            );

            if (!cart || !cart.items || cart.items.length === 0) {
                return res.redirect("/");
            }

            // Clean up invalid cart items
            cart.items = cart.items.filter(item => item.productId && item.size && item.price && item.totalPrice);
            await cart.save();

            // Map valid cart items to products
            const products = cart.items
                .filter((item) => item.productId && item.productId._id)
                .map((item) => {
                    const product = item.productId;
                    const variant = product.sizeVariants.find(v => v.size === item.size);
                    const salePrice = variant ? (variant.salePrice ?? variant.regularPrice) : (item.price ?? 0);
                    return {
                        _id: product._id,
                        productName: product.productName || "Unknown Product",
                        productImage: Array.isArray(product.productImage) && product.productImage.length > 0
                            ? product.productImage
                            : ["default-image.jpg"],
                        salePrice: parseFloat(salePrice),
                        quantity: parseInt(item.quantity || 1),
                        size: item.size
                    };
                });

            if (products.length === 0) {
                return res.redirect("/");
            }

            const subtotal = products.reduce((sum, item) => {
                return sum + item.salePrice * item.quantity;
            }, 0);

            return res.render("checkout", {
                user,
                product: products,
                subtotal,
                quantity: null,
                addressData,
            });
        }

        // Handle single product checkout
        const product = await Product.findById(productId);
        if (!product) {
            return res.redirect("/pageNotFound");
        }

        // Assume size is passed in query (e.g., req.query.size)
        const size = req.query.size?.trim().toUpperCase();
        const variant = size ? product.sizeVariants.find(v => v.size === size) : product.sizeVariants[0];
        if (!variant) {
            return res.redirect("/pageNotFound");
        }

        const productData = {
            _id: product._id,
            productName: product.productName || "Unknown Product",
            productImage: Array.isArray(product.productImage) && product.productImage.length > 0
                ? product.productImage
                : ["default-image.jpg"],
            salePrice: parseFloat(variant.salePrice ??( variant.regularPrice || 0)),
            quantity: parseInt(quantity),
            size: variant.size
        };

        const subtotal = productData.salePrice * productData.quantity;

        return res.render("checkout", {
            user,
            product: [productData],
            subtotal,
            quantity,
            addressData,
        });
    } catch (error) {
        console.error("Error fetching checkout page:", error);
        console.error(error.stack);
        return res.redirect("/pageNotFound");
    }
};

// Calculate Delivery Charge
const calculateDeliveryCharge = (address) => {
    return 0; // Free shipping
};

// Post Checkout (COD only)
const postCheckout = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to continue",
            });
        }

        const { address, products, subtotal, total } = req.body;
        if (!address || !products || !subtotal || !total) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        const parsedProducts = JSON.parse(products);
        if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No products provided",
            });
        }

        // Update product quantities
        for (const pro of parsedProducts) {
            const product = await Product.findById(pro._id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${pro._id}`,
                });
            }

            const variant = product.sizeVariants.find(v => v.size === pro.size);
            if (!variant || variant.quantity < pro.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.productName} (Size: ${pro.size})`,
                });
            }

            variant.quantity -= pro.quantity;
            product.totalSalesCount += pro.quantity;
            await product.save();
        }

        const deliveryCharge = calculateDeliveryCharge(address);
        const finalTotal = parseFloat(total) + deliveryCharge;

        const orderedItems = parsedProducts.map((product) => ({
            product: product._id,
            price: product.salePrice,
            quantity: product.quantity,
            size: product.size
        }));

        const newOrder = new Order({
            userId: userId,
            orderItems: orderedItems,
            address: address,
            shippingAddress: address,
            totalPrice: subtotal,
            finalAmount: finalTotal,
            deliveryCharge: deliveryCharge,
            status: "Pending",
            paymentMethod: "COD",
            paymentStatus: "Pending",
            paymentId: null,
        });

        const savedOrder = await newOrder.save();
        if (!savedOrder) {
            return res.status(500).json({
                success: false,
                message: "Failed to create order",
            });
        }

        // Clear cart
        await Cart.findOneAndUpdate({ userId: userId }, { $set: { items: [] } });

        return res.status(200).json({
            success: true,
            message: "Order placed successfully",
            orderId: savedOrder._id,
        });
    } catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Order Confirm
const orderConfirm = async (req, res) => {
    const orderId = req.query.id;
    try {
        if (!req.session.user) {
            return res.redirect("/signup");
        }
        return res.render("orderConfirmation");
    } catch (error) {
        return res.redirect("/pageNotFound");
    }
};

module.exports = {
    getcheckoutPage,
    postCheckout,
    orderConfirm
};