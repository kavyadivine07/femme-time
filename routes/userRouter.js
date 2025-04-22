const express= require("express")
const router= express.Router()
const userController = require("../controllers/user/userController")
const passport = require("passport")

router.get("/PageNotFound",userController.PageNotFound)

router.get("/",userController.loadHomepage)
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




module.exports= router