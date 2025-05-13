const express= require("express")
const router= express.Router()

const customerController=require("../controllers/admin/customerController")
const adminController= require("../controllers/admin/adminController")
const {adminAuth}= require("../middlewares/auth")
const categoryController= require("../controllers/admin/categoryController")
const brandController= require("../controllers/admin/brandController")
const productController=require("../controllers/admin/productController")
const orderController = require("../controllers/admin/orderController")




const multer= require("multer")
const storeage= require("../helpers/multer")
const uploads= multer({storage:storeage})


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
router.get("/listCategory",adminAuth,categoryController.getListCategory)
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory)
router.get("/editCategory",adminAuth,categoryController.getEditCategory)
router.put("/editCategory/:id",adminAuth,categoryController.editCategory)

//brand management
router.get("/brands",adminAuth,brandController.getBrandPage)
router.post("/addBrand",adminAuth,uploads.single("image"),brandController.addBrand)
router.get("/blockBrand",adminAuth,brandController.blockBrand)
router.get("/unBlockBrand",adminAuth,brandController.unBlockBrand)
router.get("/deleteBrand",adminAuth,brandController.deleteBrand)

//product management
router.get("/addProducts",adminAuth,productController.getProductAddPage)
router.post("/addProducts",adminAuth,uploads.array("images",4),productController.addProducts)
router.get("/products",adminAuth,productController.getAllProducts)
router.get('/editProduct/:id',adminAuth,productController.getEditProduct)
router.post('/edit-product', adminAuth, uploads.array('images', 4), productController.updateProduct);

router.get("/block-product/:id", adminAuth, productController.blockProduct);

//  order management
// router.get('/orders',adminAuth,orderController.getOrders)
// router.get('/orderList', adminAuth, orderController.listOrders);
// router.get('/orders/cancelled', adminAuth, orderController.getCancelledOrders);
// router.get('/orders/:orderId', adminAuth, orderController.getAdminOrderDetails);
// router.post('/orders/update-status', adminAuth, orderController.updateOrderStatus);



router.post("/place-order", orderController.placeOrder);
router.get("/cancel-order/:orderId", orderController.cancelOrder);
router.get("/return-order-item/:orderId/:productId/:size", orderController.returnOrderItem);


module.exports= router