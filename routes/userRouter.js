const express= require("express")
const router= express.Router()
const userController = require("../controllers/user/userController")
const profileController= require("../controllers/user/profileController")
const passport = require("passport")
const {userAuth}=require("../middlewares/auth")

router.get("/PageNotFound",userController.PageNotFound)

router.get("/",userController.loadHomepage)
router.get('/shop',userController.loadShopPage)
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

router.get("/userProfile",userAuth,profileController.userProfile)
router.get('/change-email',userAuth,profileController.changeEmail)
router.post('/change-email',userAuth,profileController.changeEmailValid)
router.post('/verify-email-otp',userAuth,profileController.verifyEmailOtp)
router.post("/update-email",userAuth,profileController.updateEmail)
router.get('/change-password',userAuth,profileController.changePassword)
router.post('/change-password',userAuth,profileController.changePasswordlValid)
router.post('/verify-change-password-otp',userAuth,profileController.verifyChangePasswordOpt)





module.exports= router