
const User = require("../../models/userSchema")


  const loadCustomer = async(req,res)=>{
    try {
        const user = await User.find(req.session.user)
        return res.render('customers')
    } catch (error) {
        
    }
}


const customerInfo = async(req,res)=>{
    try {
        let search=""
        if(req.query.search){
            search=req.query.search
        }
        let page=1
        if(req.query.page){
            page=req.query.page
        }
        const limit = 3
        const userData = await User.find({isAdmin:false, $or:[{name:{$regex:".*"+search+".*"}},{email:{$regex:".*"+search+".*"}}]})
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec()

        const count = await User.find({isAdmin:false, $or:[{name:{$regex:".*"+search+".*"}},{email:{$regex:".*"+search+".*"}}]})
        .countDocuments()
        
        res.render('customers',{
            data : userData,
            totalPages: Math.ceil(count/limit),
            currentPage:parseInt(page)
        })
        

    } catch (error) {
        console.log(error)
    }
}

const customerBlocked= async (req,res)=>{
    try {
        let id= req.query.id
        console.log("Blocked ID:", req.query.id);
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect("/admin/customers")

    } catch (error) {
        res.redirect("/pageError")
        
    }
}

const customerunBlocked= async (req,res)=>{
    try {
        let id= req.query.id
        console.log(id)
        await User.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect("/admin/customers")
        
    } catch (error) {
        res.redirect("/pageError")
        
    }
}







module.exports={
    customerInfo,
    loadCustomer,
    customerBlocked,
    customerunBlocked,


}