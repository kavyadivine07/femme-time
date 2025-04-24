const express= require("express")
const router= express.Router()

const customerController=require("../controllers/admin/customerController")
const adminController= require("../controllers/admin/adminController")
const {userAuth,adminAuth}= require("../middlewares/auth")
const categoryController= require("../controllers/admin/category controller")

//login management
router.get("/login",adminController.loadLogin)
router.post("/login",adminController.login)
router.get("/dashboard",adminAuth,adminController.loadDashboard)
router.get("/pageError",adminController.pageError)
router.get("/logout",adminController.logout)


//user management

router.get("/customers",customerController.customerInfo)

router.get("/blockCustomer",adminAuth,customerController.customerBlocked)
router.get("/unblockCustomer",adminAuth,customerController.customerunBlocked)

//category management
router.get("/category",adminAuth,categoryController.categoryInfo)
router.post("/addCategory",adminAuth,categoryController.addCategory)
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer)
router.post("/removeCategoryOffer",adminAuth,categoryController.removeCategoryOffer)
router.get("/listCategory",adminAuth,categoryController.getListCategory)
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory)
router.get("/editCategory",adminAuth,categoryController.getEditCategory)
router.post("/editCategory/:id ",adminAuth,categoryController.editCategory)



module.exports= router