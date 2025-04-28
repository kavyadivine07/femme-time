const Product= require("../../models/productSchema")
const Category= require("../../models/categorySchema")
const Brand= require("../../models/brandSchema")
const User= require("../../models/userSchema")
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
                    const originalImagePath = req.files[i].path;
                   
                    images.push(req.files[i].filename);
                }
            }

            
            const categoryId = products.category;

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: products.brand,
                category: categoryId,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice || 0,
                createdOn: new Date(),
                quantity: products.quantity,
                color: products.color,
                productImage: images,
                status: "Available"
            });

            console.log(images);
            
            await newProduct.save();
            
            return res.redirect("/admin/addProducts");
        } else {
           
            return res.redirect("/admin/addProducts");
        }
    } catch (error) {
        console.error("Error adding product:", error);
        return res.redirect("/admin/pageError");
    }
};
// const getAllProducts = async (req, res) => {
//     try {
//         const search = req.query.search || '';
//         const products = await Product.find({
//             $or: [
//                 { productName: { $regex: search, $options: 'i' } },
//                 { brand: { $regex: search, $options: 'i' } }
//             ],
//             isBlocked: false
//         }).populate('category');
//         const categories = await Category.find({ isListed: true });
//         res.render('admin/products', { products, categories, search });
//     } catch (err) {
//         res.status(500).send('Server Error');
//     }
// };

//for displaying products in product page
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

// Updated updateProduct controller

const updateProduct = async (req, res) => {
  try {
    const productId = req.body.productId;
    
    // Get the basic product data
    const updateData = {
      productName: req.body.productName,
      description: req.body.description,
      brand: req.body.brand,
      category: req.body.category,
      regularPrice: req.body.regularPrice,
      salePrice: req.body.salePrice,
      quantity: req.body.quantity,
      color: req.body.color
    };
    
    // Set product status based on quantity
    if (updateData.quantity <= 0) {
      updateData.status = 'Out of Stock';
    } else {
      updateData.status = 'Available';
    }
    
    // Get the current product to work with its images
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
      
      // Optional: Delete the actual image files from the server
      // This requires fs module to be imported
      // imagesToDelete.forEach(index => {
      //   const imagePath = path.join(__dirname, '../public', product.productImage[index]);
      //   if (fs.existsSync(imagePath)) {
      //     fs.unlinkSync(imagePath);
      //   }
      // });
    }
    
    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Ensure consistent path format
        const imageUrl = `/uploads/re-image/${file.filename}`;
        existingImages.push(imageUrl);
      }
    }
    
    // Update product images
    updateData.productImage = existingImages;
    
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


module.exports={
    getProductAddPage,
    addProducts,
    getAllProducts,
    getEditProduct,
    updateProduct
}


