const Category= require("../../models/categorySchema")
const Product=require("../../models/productSchema")



const categoryInfo= async (req,res)=>{
    try {
        const page = parseInt(req.query.page)|| 1
        const limit=4
        const skip= (page-1)*limit

        const categoryData= await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)

        const totalCategories = await Category.countDocuments()
        const totalPages= Math.ceil(totalCategories/limit)
        res.render("category",{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories
        })

    } catch (error) {
        console.error("error")
        res.redirect("/pageError")
    }
}

const addCategory= async (req,res)=>{
    const {name,description}= req.body

    try {
        const existingCatogory = await Category.findOne({name})
        if(existingCatogory){
            console.log('Category already exists:', name)
          
            return res.status(500).json({error:"category already exists"})
            
        }
        const newCategory= new Category({name,description})
        await newCategory.save()
        console.log('New category added:', newCategory)
        return res.json({message:"Category added successfully"})
    } catch (error) {
        return res.status(500).json({error:"Internal server error"})
    }
}


const addCategoryOffer= async (req,res)=>{
    try {
        const percentage= parseInt(req.body.percentage)
        const categoryId= req.body.categoryId;
        console.log(categoryId)
//to find category from database
        const category= await Category.findById(categoryId)
if(!category){
    console.log('Category not found:', categoryId)
    return res.status(404).json({status:false, message:"Category not found"})

}

//to check if any product has offer
const products = await Product.find({category:category._id})
console.log(products)
const hasProductOffer=products.some(product =>product.productOffer> percentage)
   if(hasProductOffer){
    return res.json({status:false, message:"Products with this category already have product offer !!!"})
   }
await Category.updateOne({_id:categoryId},{$set:{CategoryOffer:percentage}})

for(const product of products){
    product.productOffer=0
    product.salePrice= product.regularPrice
    await product.save()
}
res.json({status:true})

} catch (error) {
       res.status(500).json({status:false, message:"Internal server error"}) 
    }
}

// function removeCategoryOffer defined

const removeCategoryOffer= async (req,res)=>{
    try {
        const categoryId= req.body.categoryId;
        console.log('Removing offer from category:', categoryId)
//to find category from database
        const category= await Category.findById(categoryId)
if(!category){
    console.log('Category not found:', categoryId);
    return res.status(404).json({status:false, message:"Category not found"})

}
//to find the percentage of product
const percentage= category.CategoryOffer

//to check if any product has offer
const products = await Product.find({category:category._id})

if(products.length>0){
    for(const product of products){
        product.salePrice+=Math.floor(product.regularPrice * (percentage/100))
        product.productOffer=0
        await product.save()
    
    }   
}category.CategoryOffer=0
   
await category.save()
res.json({status:true})

} catch (error) {
    console.error('Error while removing offer:', error);
       res.status(500).json({status:false, message:"Internal server error"}) 
    }
}


//function to get listed categories

const getListCategory= async (req,res)=>{
    try{
        let id= req.query.id
        console.log("id is:",id)
        await Category.updateOne({_id:id},{$set:{isListed:false}})
        res.redirect("/admin/category")
    }catch(error){
        res.redirect("/pageError")
    }
}


const getUnlistCategory= async (req,res)=>{
    try{
        let id= req.query.id
  
        await Category.updateOne({_id:id},{$set:{isListed:true}})
        res.redirect("/admin/category")
    }catch(error){
        res.redirect("/pageError")
    }
}



//to edit category

const getEditCategory= async (req,res)=>{
    try {
        const id = req.query.id
       
        const category= await  Category.findOne({_id:id})
       
        res.render("editCategory",{category:category})
    } catch (error) {
        res.redirect("/pageError")
    }

}

const editCategory = async (req,res)=>{
    try {
        const id= req.params.id;
      console.log(id)
        const {categoryName,description}= req.body
        console.log(categoryName)
        const existCategory= await Category.findOne({name:categoryName})
       
        if(existCategory){
            return res.status(400).json({error: "Category exist, please choose another name"})
        }
        const updateCategory= await Category.findByIdAndUpdate(id,{
            name:categoryName,
            description:description,
        },{new:true})

        if(updateCategory){
            res.redirect("/admin/category")


        }else{
            res.status(404).json({error:"Category not found"})
        }

    } catch (error) {
        res.status(500).json({error:"Internal Server error"})
        
        
    }
}









module.exports={
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,


    


}