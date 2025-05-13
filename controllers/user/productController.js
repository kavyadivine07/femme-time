const Product= require("../../models/productSchema")
const Category =require("../../models/categorySchema")
const User= require("../../models/userSchema")





const productDetails= async (req,res)=>{
    try {
        const userId= req.session.user
        const userData= await User.findById(userId)
        const productId= req.query.productId

        const product = await Product.findById(productId)
        .populate('category','name')
        .populate('brand','brandName')
        

        res.render("productDetails", {
            
            user:userData,
            product:product, 
            category: product.category,
            quantity:product.quantity
        });
        


    } catch (error) {
        console.error("Error for fetching product details",error);
        res.redirect("/pageNotFound")
        
    }
}



module.exports={
    productDetails,

}