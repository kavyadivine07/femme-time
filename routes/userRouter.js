const express= require("express")
const router= express.Router()
const userController = require("../controllers/user/userController")
const profileController= require("../controllers/user/profileController")
const passport = require("passport")
const {userAuth}=require("../middlewares/auth")
const productController =require("../controllers/user/productController.js")
const cartController=require("../controllers/user/cartController.js")
const checkoutController= require("../controllers/user/checkoutController.js")
const orderController= require("../controllers/user/orderController.js")
const upload = require("../middlewares/multerConfig.js");
const wishlistController=require("../controllers/user/wishlistController.js")

router.get("/PageNotFound",userController.PageNotFound)

router.get("/",userController.loadHomepage)
router.get('/shop',userAuth,userController.loadShopPage)
router.get("/login",userController.loadLogin)
router.get("/signup",userController.loadSignin)
router.post("/signup",userController.signup)
router.post("/login",userController.login)
router.post("/verifyOtp",userController.loadVerifyOtp)

router.get("/auth/google",passport.authenticate('google',{scope:['profile', 'email']}))
router.get('/auth/google/callback',passport.authenticate("google",{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
})

router.get("/logout",userController.logout)

//profile management

router.get('/forgotPassword',profileController.getForgotPassword)
router.post('/forgot-email-valid',profileController.forgotEmailValid)
router.post('/verify-passForgot-otp',profileController.verifyForgotPassOtp)
router.get('/reset-password',profileController.getResetPassword)
router.post("/resend-forgot-otp",profileController.resendOtp)
router.post("/reset-password",profileController.postNewPassword)

router.get("/userProfile",userAuth,profileController.userProfile)
router.get('/change-email',userAuth,profileController.changeEmail)
router.post('/change-email',userAuth,profileController.changeEmailValid)
router.post('/verify-email-otp',userAuth,profileController.verifyEmailOtp)
router.post("/update-email",userAuth,profileController.updateEmail)
router.get('/change-password',userAuth,profileController.changePassword)
router.post('/change-password',userAuth,profileController.changePasswordValid)
router.post('/verify-change-password-otp',userAuth,profileController.verifyChangePasswordOtp)

router.post('/profile/upload-photo', userAuth, upload.single('profilePhoto'), profileController.uploadProfilePhoto);

//address management
router.get('/addAddress', userAuth, profileController.addAddress)
router.post('/addAddress', userAuth, profileController.postAddAddress)
router.get('/editAddress', userAuth, profileController.editAddress)
router.post('/editAddress', userAuth, profileController.postEditAddress)
 router.get('/deleteAddress', userAuth, profileController.deleteAddress); 



 //product management

 router.get('/productDetails',userAuth,productController.productDetails)


 //cart management

 router.post('/addToCart',userAuth,cartController.addToCart);
 router.get('/cart',userAuth,cartController.getCart);
 router.post('/cart/update-quantity', userAuth, cartController.updateQuantity);
 router.post('/cart/remove', userAuth, cartController.removeFromCart);


//checkoutpage.
router.get("/checkout",userAuth,checkoutController.getcheckoutPage);

router.post("/checkout",userAuth,checkoutController.postCheckout);
router.get("/orderConfirmation",checkoutController.orderConfirm);




//order management.

router.get('/history', userAuth, orderController.getOrderHistory);
router.post('/orders/cancel', userAuth, orderController.cancelOrder);
router.get('/status/:orderId', userAuth, orderController.getOrderStatus);
router.get('/orders/:orderId', userAuth, orderController.getOrderDetails);
router.put('/:orderId/status',userAuth, orderController.changeOrderStatus); 
router.get('/orders/view/:id',userAuth, orderController.viewOrderDetails); 
router.post('/orders/update-status',userAuth, orderController.updateOrderStatus);
router.get('/return-reason', userAuth, orderController.showReturnReasonPage);
router.post('/process-return',userAuth, orderController. submitReturnReason);
router.post('/update-status', userAuth, orderController.updateOrderStatus);
router.get('/return-reason/:orderId',userAuth,orderController. showReturnReasonPage);

router.get('/orders/:orderId/products', userAuth, orderController.getOrderProducts);
router.post('/orders/:orderId/cancel', userAuth, orderController.cancelOrderProducts);
router.post('/orders/:orderId/return', userAuth, orderController.returnOrderProducts);




//wishlist Management...............................................................................................

router.get("/wishlist",userAuth,wishlistController.loadWishlist);
router.post("/addToWishlist",userAuth,wishlistController.addToWishlist)
router.delete('/wishlist/remove/:id', wishlistController.removeFromWishlist);





module.exports= router