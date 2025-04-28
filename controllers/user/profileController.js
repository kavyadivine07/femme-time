const User= require("../../models/userSchema")
const env= require("dotenv").config()
const nodemailer= require("nodemailer")
const bcrypt = require("bcrypt")
const session= require('express-session')


function generateOtp(){
    const digits= "1234567890"
    let otp=""
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }
    return otp
}
const sendVerificationEmail= async (email,otp)=>{
try {
    const transpoter= nodemailer.createTransport({
        service:"gmail",
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
            user:process.env.NODEMAILER_EMAIL,
            pass:process.env.NODEMAILER_PASSWORD,

        }
    })
const mailOptions= {
    from:process.env.NODEMAILER_EMAIL,
    to:email,
    subject:"Your otp for password reset ",
    trxt:`Your otp is : ${otp}`,
    html: `<b><h4> Your otp :${otp}</h4></b>`

}
const info= await transpoter.sendMail(mailOptions)
console.log("email send", info.messageId)
    return true

    
} catch (error) {
    console.error("error sending email",error)
    return false
    
}
}






const PageNotFound= async (req,res) => {
    try{
        res.render("page404")

    }catch(error){
        res.redirect("/PageNotFound")
    }
}

    const getForgotPassword = async (req, res) => {
        
        try {
            const user = req.session.user;
            let userData = null;
            if (user) {
                userData = await User.findById(user);
            }
            res.render("forgotPassword", { user: userData });
        } catch (error) {
            console.log(error);
            res.redirect('/PageNotFound');
        }
    }
    
    const forgotEmailValid= async (req,res)=>{
        try {
            const {email} = req.body
            const findUser= await User.findOne({email})
            if(findUser){
                const otp= generateOtp()
                const emailSent= await sendVerificationEmail(email,otp)
                if(emailSent){
                    req.session.userOtp=otp;
                    req.session.email=email
                    req.session.email = email;
                    const user = req.session.user;  
                    res.render("forgotPass-otp", { user });  
                    console.log("OTP:", otp);
                }else{
                    res.json({success:false,message:"failed to send otp , please try again"})
                }
            }else{
                res.render("Forgot-password",{
                    message:"User with this email does not exist"
                })
            }
        } catch (error) {
            res.redirect("/pageNotFound")
            
        }
    }
const verifyForgotPassOtp= async (req,res)=>{
    try {
        const enteredOtp= req.body.otp
        if(enteredOtp===req.session.userOtp){
            
            res.json({success:true,redirectUrl:"/home"})
        }else{
            res.json({success:false,message:"OTP not matching"})
        }
    } catch (error) {
        res.status(500).json({success:false,message:"An error occoured. please try again"})
        
    }
}

async function userProfile(req, res) {
    try {
        const userId = req.session.user
        const userData = await User.findById(userId)
        res.render("profile", {
            user:userData,
        })
    }

    catch (error) {
        console.error("Error while retriving profile data ", error)
        res.redirect("/pageNotFound")
    }


}
const changeEmail= async (req,res)=>{
    try {
        res.render("change-email",{ user: req.session.user })
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}
const changeEmailValid = async(req,res)=>{
    try {
        const {email}= req.body;
        const userExists= await User.findOne({email})
        if(userExists){
            const otp= generateOtp()
            const emailSend= await sendVerificationEmail(email,otp)
            if(emailSend){
                req.session.userOtp= otp
                req.session.userData= req.body
                req.session.email= email
                res.render("change-email-otp",{ user: req.session.user })
                console.log("Email send", email)
                console.log("otp :",otp);
            }else{
                res.json({error:"email-error"})
            }
        }else{
            res.render("change-email",{
                message:"User with this email not exist"
            })
        }
    } catch (error) {
        res.redirect("/pageNotFound")
        
    }
}

const verifyEmailOtp = async (req,res)=>{
    try {
    const enteredOtp=req.body.otp
        if(enteredOtp===req.session.userOtp){
            req.session.userData= req.body.userData
            res.render("new-email",{ user: req.session.user,
                userData:req.session.userData})
        }else{
            res.render("change-email-otp",{
                message:"otp not matching",
                userData:req.session.userData
            })
           
        }

} catch (error) {
    res.redirect("/pageNotFound")
}

}

const updateEmail= async(req,res)=>{
    try {
        const newEmail= req.body.newEmail
        const userTd= req.session.user
        await User.findByIdAndUpdate(userTd,{email:newEmail})
        res.redirect("/userProfile")


    } catch (error) {
        
        res.redirect("/pageNotFound")
    }
}

const changePassword = async (req,res)=>{
    try {
        res.render("change-password",{ user: req.session.user})

    } catch (error) {
         res.redirect("/pageNotFound")
    }
}

const changePasswordlValid= async (req,res)=>{
    try {
        const {email}= req.body;
        const userExists= await User.findOne({email})
        if(userExists){
            const otp= generateOtp()
            const emailSend= await sendVerificationEmail(email,otp)
            if(emailSend){
                req.session.userOtp= otp
                req.session.userData= req.body
                req.session.email= email
                res.render("change-password-otp",{ user: req.session.user })
                console.log("Email send", email)
                console.log("otp :",otp);
            }else{
                res.json({
                    success:false,
                    message:"failed to send otp , please try again"
                })
            }
        }else{
            res.render("change-email",{
                message:"User with this email not exist"
            })
        }
    } catch (error) {
        console.log("Error in change password validation",error)
        res.redirect("/pageNotFound")
        
    }
}

const verifyChangePasswordOpt= async(req,res)=>{
    try {
        const enteredOtp=req.body.otp
            if(enteredOtp===req.session.userOtp){
                res.json({success:true,redirect:"/reset-password"})
                
            }else{
                res.json({success:false,message:"Otp not matching"})
            }
    
    } catch (error) {
        res.status(500).json({success:false,message:"An error occoured please try again later"})
        res.redirect("/pageNotFound")
    }
    
}






module.exports={
  
    PageNotFound,
    getForgotPassword,
    forgotEmailValid,
    verifyForgotPassOtp,
    userProfile,
    changeEmail,
    changeEmailValid,
    verifyEmailOtp,
    updateEmail,
    changePassword,
    changePasswordlValid,
    verifyChangePasswordOpt,


    







    
}