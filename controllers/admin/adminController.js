const User= require("../../models/userSchema")
const mongoose=require("mongoose")
const bcrypt = require("bcrypt")





const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
    res.render("adminLogin",{message:null})
}
const login= async (req,res)=>{
    try {
        const {email,password} =req.body  
        const admin = await User.findOne({email,isAdmin:true})
        if(admin){
            const passwordMatch = bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin= true
                return res.redirect("/admin/dashboard") 

            }else{
                return res.redirect("/login")
            }
        }else{
            return res.redirect("/login")
        }
    
    } catch (error) {
        console.log("login error",error)
        return res.redirect('/pageError')
    }
}

const loadDashboard = async (req,res)=>{
    if(req.session.admin){
        try {
            res.render("dashboard")
        } catch (error) {
            res.redirect("/pageError")
            
        }
    }
}
const pageError = async (req,res)=>{
    res.render("pageError")
}

const logout = async (req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("error while destroying",err)
                return res.redirect('/pageError')
                
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log("Error while logout")
        res.redirect("/pageError")
        
    }
}




module.exports={
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout

}