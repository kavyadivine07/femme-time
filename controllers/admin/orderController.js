const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");

const placeOrder = async (req, res) => {
    try {
        const { userId, items, totalPrice, finalAmount, address, couponApplied, discount } = req.body; // Adjust based on your frontend data

        // Validate and update product quantities
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
            }

            const variant = product.sizeVariants.find(v => v.size === item.size);
            if (!variant) {
                return res.status(404).json({ success: false, message: `Size variant ${item.size} not found for product ${product.productName}` });
            }

            if (variant.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.productName} (Size: ${item.size})` });
            }

            // Decrease quantity
            variant.quantity -= item.quantity;

            // Update product status
            const totalQuantity = product.sizeVariants.reduce((sum, v) => sum + v.quantity, 0);
            product.status = totalQuantity > 0 ? "Available" : "Out of Stock";

            await product.save();
        }

        // Create the order
        const order = new Order({
            userId,
            OrderedItems: items.map(item => ({
                product: item.product,
                size: item.size,
                quantity: item.quantity,
                price: item.price
            })),
            totalPrice,
            discount: discount || 0,
            finalAmount,
            address,
            status: "Pending",
            invoiceDate: new Date(),
            couponApplied: couponApplied || false,
            paymentStatus: "Pending"
        });

        await order.save();

        res.status(201).json({ success: true, message: "Order placed successfully", order });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Failed to place order", error: error.message });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === "Cancelled") {
            return res.status(400).json({ success: false, message: "Order is already cancelled" });
        }

        // Restore product quantities
        for (const item of order.OrderedItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                console.error(`Product not found during cancellation: ${item.product}`);
                continue;
            }

            const variant = product.sizeVariants.find(v => v.size === item.size);
            if (variant) {
                variant.quantity += item.quantity;

                // Update product status
                const totalQuantity = product.sizeVariants.reduce((sum, v) => sum + v.quantity, 0);
                product.status = totalQuantity > 0 ? "Available" : "Out of Stock";

                await product.save();
            }
        }

        // Update order status
        order.status = "Cancelled";
        order.paymentStatus = "Failed"; // Adjust based on your logic
        await order.save();

        res.redirect("/admin/orders"); // Adjust redirect as needed
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.redirect("/admin/pageError");
    }
};

const returnOrderItem = async (req, res) => {
    try {
        const { orderId, productId, size } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const item = order.OrderedItems.find(i => i.product.toString() === productId && i.size === size);
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found in order" });
        }

        // Restore product quantity
        const product = await Product.findById(productId);
        if (product) {
            const variant = product.sizeVariants.find(v => v.size === size);
            if (variant) {
                variant.quantity += item.quantity;

                // Update product status
                const totalQuantity = product.sizeVariants.reduce((sum, v) => sum + v.quantity, 0);
                product.status = totalQuantity > 0 ? "Available" : "Out of Stock";

                await product.save();
            }
        }

        // Update order
        order.OrderedItems = order.OrderedItems.filter(i => !(i.product.toString() === productId && i.size === size));
        order.totalPrice -= item.price * item.quantity;
        order.finalAmount -= item.price * item.quantity;
        if (order.OrderedItems.length === 0) {
            order.status = "Cancelled";
            order.paymentStatus = "Failed";
        } else {
            order.status = "Returned";
        }

        await order.save();

        res.redirect("/admin/orders"); // Adjust redirect as needed
    } catch (error) {
        console.error("Error returning order item:", error);
        res.redirect("/admin/pageError");
    }
};

module.exports = {
    placeOrder,
    cancelOrder,
    returnOrderItem
};