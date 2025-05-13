const Product= require("../../models/productSchema")
const Category= require("../../models/categorySchema")
const Brand= require("../../models/brandSchema")
const path= require("path")
const fs= require("fs")
const sharp= require("sharp")



const getProductAddPage= async(req,res)=>{
    try {
        const category = await Category.find({isListed:true})
        const brand= await Brand.find({isBlocked:false})
        res.render("productAdd",{
            cat:category,
            brand:brand
        })

    } catch (error) {
        res.redirect("/pageError")
        
    }
}




const addProducts = async(req, res) => {
  try {
      const products = req.body;
      const productExists = await Product.findOne({
          productName: products.productName
      });

      if (!productExists) {
          const images = [];
          if (req.files && req.files.length > 0) {
              for (let i = 0; i < req.files.length; i++) {
                  // Store only the filename - this is critical
                  images.push(req.files[i].filename);
              }
          }
          
          // Create size variants array based on input
          const sizeVariants = [];
          
          // Assuming you're getting size, regularPrice, salePrice, and quantity for each variant
          // Adjust this based on your actual form structure
          const sizes = Array.isArray(products.size) ? products.size : [products.size];
          const regularPrices = Array.isArray(products.regularPrice) ? products.regularPrice : [products.regularPrice];
          const salePrices = Array.isArray(products.salePrice) ? products.salePrice : [products.salePrice];
          const quantities = Array.isArray(products.quantity) ? products.quantity : [products.quantity];
          
          
              
              sizeVariants.push({
                  size: sizes[i],
                  regularPrice: regularPrice,
                  salePrice: salePrice,
                 
                  quantity: quantity
              });
          }

          const categoryId = products.category;

          const newProduct = new Product({
              productName: products.productName,
              description: products.description,
              brand: products.brand,
              category: categoryId,
              sizeVariants: sizeVariants,  // Add size variants array
              color: products.color,
              productImage: images,
              status: "Available"
          });
          
          console.log("New product to be saved:", newProduct);
          await newProduct.save();
          
          return res.redirect("/admin/addProducts");
      } else {
          // Product already exists
          return res.redirect("/admin/addProducts");
      }
  } catch (error) {
      console.error("Error adding product:", error);
      return res.redirect("/admin/pageError");
  }
};


const updateProduct = async (req, res) => {
try {
  const productId = req.body.productId;
  
  // Get the current product to work with its images and data
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  
  // Handle image deletion
  let existingImages = [...product.productImage];
  if (req.body.imagesToDelete) {
    const imagesToDelete = JSON.parse(req.body.imagesToDelete);
    
    // Filter out the images that should be deleted
    existingImages = existingImages.filter((_, index) => !imagesToDelete.includes(index.toString()));
  }
  
  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      // Just store the filename, not the full path
      existingImages.push(file.filename);
    }
  }
  
  // Process size variants
  const sizeVariants = [];
  
  // Parse form data for size variants
  const sizes = Array.isArray(req.body.size) ? req.body.size : [req.body.size];
  const regularPrices = Array.isArray(req.body.regularPrice) ? req.body.regularPrice : [req.body.regularPrice];
  const salePrices = Array.isArray(req.body.salePrice) ? req.body.salePrice : [req.body.salePrice];
  const quantities = Array.isArray(req.body.quantity) ? req.body.quantity : [req.body.quantity];
  
  // Build size variants array
  for (let i = 0; i < sizes.length; i++) {
    const regularPrice = parseFloat(regularPrices[i] || regularPrices[0]);
    const salePrice = parseFloat(salePrices[i] || salePrices[0]);
    const quantity = parseInt(quantities[i] || quantities[0]);
    
    
    
    sizeVariants.push({
      size: sizes[i],
      regularPrice: regularPrice,
      salePrice: salePrice,
      
      quantity: quantity
    });
  }
  
  // Determine overall product status based on all size variants
  const totalQuantity = sizeVariants.reduce((total, variant) => total + variant.quantity, 0);
  const status = totalQuantity > 0 ? 'Available' : 'Out of Stock';
  
  // Create update data object
  const updateData = {
    productName: req.body.productName,
    description: req.body.description,
    brand: req.body.brand,
    category: req.body.category,
    sizeVariants: sizeVariants,
    color: req.body.color,
    productImage: existingImages,
    status: status
  };
  
  // Update the product in the database
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    updateData,
    { new: true, runValidators: true }
  );
  
  // Redirect to product listing page
  res.redirect('/admin/products');
  
} catch (error) {
  console.error('Error updating product:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Failed to update product', 
    error: error.message 
  });
}
};

// Helper function to ensure proper image upload configuration
const configureMulter = () => {
const multer = require('multer');


// Define storage for product images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/re-image'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Return multer instance
return multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
};

// Export the multer middleware that can be used in routes
const upload = configureMulter();


const getAllProducts = async (req, res) => {
    try {
       
        let { search = '', page = 1 } = req.query;
        const limit = 10; 
        page = parseInt(page);
        const skip = (page - 1) * limit;

        
        let filter = {};

        if (search) {
            // Find brands matching search term
            const matchedBrands = await Brand.find({
                brandName: { $regex: search, $options: "i" }
            }).select('_id');
            
    
            filter = {
                $or: [
                    { productName: { $regex: search, $options: "i" } },
                    { brand: { $in: matchedBrands.map(b => b._id) } }
                ]
            };
        }

        const productData = await Product.find(filter)
            .populate('category', 'name')
            .populate('brand', 'brandName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
            console.log(productData);
            
        const count = await Product.countDocuments(filter);
        
        
        res.render("products", {
            data: productData,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            search: search
        });

    } catch (error) {
        console.error("Error in getAllProducts:", error);
        res.redirect("/admin/pageError");
    }
};


const getEditProduct =  async (req,res)=>{
    try {
        const productId = req.params.id;
        
        // Fetch the product data with populated brand and category
        const product = await Product.findById(productId)
          .populate('brand')
          .populate('category');
        
        if (!product) {
          return res.status(404).render('error', { 
            message: 'Product not found',
            error: { status: 404 } 
          });
        }
        
        // Fetch all brands and categories for the dropdowns
        const brands = await Brand.find({ isBlocked: false });
        const categories = await Category.find({ isListed: true });
        
        // Render the edit page with product data
        res.render('editProduct', {
          product,
          brands,
          categories,
          title: 'Edit Product',
          admin: req.session.admin
        });
        
      } catch (error) {
        console.error('Error fetching product for edit:', error);
        res.status(500).render('error', { 
          message: 'Internal server error',
          error: { status: 500 } 
        });
      }
}

const blockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const size = req.query.size; // Get size from query parameter

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Find the size variant and toggle its isBlocked field
    const variant = product.sizeVariants.find(v => v.size === size);
    if (!variant) {
      return res.status(404).json({ success: false, message: "Size variant not found" });
    }

    variant.isBlocked = !variant.isBlocked;

    // Update product status based on all variants
    const allBlocked = product.sizeVariants.every(v => v.isBlocked);
    const totalQuantity = product.sizeVariants.reduce((sum, v) => sum + (v.isBlocked ? 0 : v.quantity), 0);

    if (allBlocked) {
      product.status = "Discontinued";
    } else if (totalQuantity > 0) {
      product.status = "Available";
    } else {
      product.status = "Out of Stock";
    }

    await product.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error blocking/unblocking product:", error);
    res.redirect("/admin/pageError");
  }
};

module.exports={
    getProductAddPage,
    addProducts,
    getAllProducts,
    getEditProduct,
    updateProduct,
    blockProduct,
}


