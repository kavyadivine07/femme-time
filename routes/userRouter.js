const express= require("express")
const router= express.Router()
const userController = require("../controllers/user/userController")

router.get("/PageNotFound",userController.PageNotFound)

router.get("/",userController.loadHomepage)
router.get("/login",userController.loadLogin)
router.get("/signin",userController.loadSignin)
router.post("/signin",userController.signin)


module.exports= router