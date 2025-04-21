const User= require("../../models/userSchema")
const env= require("dotenv").config

const nodemailer= require("nodemailer")

const PageNotFound= async (req,res)=>{
    try{
        res.render("page404")

    }catch(error){
        res.redirect("/PageNotFound")
    }
}

const loadHomepage= async (req,res)=>{
    try{
        return res.render("home")

    }catch(error){
        console.log("Home page not found")
        res.status(500).send("server error")
    }
}


const loadLogin= async (req,res)=>{
    try{
        return res.render("login")

    }catch(error){
        console.log("Home page not loading : ",error)
        res.status(500).send("server error")
    }
}

const loadSignin= async (req,res)=>{
    try{
        return res.render("Signin")

    }catch(error){
        console.log("Home page not loading : ",error)
        res.status(500).send("server error")
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString()
}

async function sendVarificationEmail(email,otp){
    try{
        const transporter=nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })
        const info= await transporter.sendMail({
           from:process.env.NODEMAILER_EMAIL,
           to: email,
           subject:"verify your otp",
           text:`your otp is ${otp}`,
           html:`<b>Your otp : ${otp}</b>`
        })
        return info.accepted.length>0
    } catch(error){
        console.error("Error while sending email",error)
        return false

    }
}

const signin= async (req,res)=>{
    
    try{
        const {email,password,cpassword}= req.body

            if(password!==cpassword){
                return res.render("signin",{message:"Password not match"})
            }
        const findUser = await User.findOne({email})
        if(findUser){
            return res.render("signin",{message: "User with this email alredy exist"})
        }
        const otp= generateOtp()

        const emailSent= await sendVarificationEmail(email,otp)
        if(!emailSent){
            return res.json("email error")
        }
        req.session.userOtp=otp
        req.session.userData={email,password}
        res.render("verifyOtp")
        console.log("otp send",otp)

    }catch(error){
        console.error("Signin error",error)
        res.redirect("/pageNotFound")
    }
}


module.exports={
    loadHomepage,
    PageNotFound,
    loadLogin,
    loadSignin,
    signin
}