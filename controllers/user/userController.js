const User= require("../../models/userSchema")
const env= require("dotenv").config()
const nodemailer= require("nodemailer")
const bcrypt = require("bcrypt")
const Product = require('../../models/productSchema')
const Brand = require("../../models/brandSchema")
const Category = require('../../models/categorySchema')
const PageNotFound= async (req,res)=>{
    try{
        res.render("page404")

    }catch(error){
        res.redirect("/PageNotFound")
    }
}

const loadHomepage= async (req,res)=>{
    try{
        const categories = await Category.find({ isListed: true });

        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(cat => cat._id) }, // Fixed mapping
            quantity: { $gt: 0 }
        });
        
        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn)); // Fixed sorting
        productData = productData.slice(0, 4); // Get the top 4 products
        
const user= req.session.user
        const userData = await User.findById(user)

       if(userData){
        if(userData && userData.isBlocked){
            return res.redirect('/login')
        }
        return res.render('home',{user:userData,products:productData})
       }else{
        return res.render('home',{user:null,products:productData})
       }
       
    }catch(error){
        console.log("Home page not found")
        res.status(500).send("server error")
    }
}

const loadShopPage = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = user ? await User.findById(user) : null;
        
        // Fetch products, brands, and categories
        const products = await Product.find({ isBlocked: false })
            .populate('brand')
            .populate('category')
            .select("productName productImage regularPrice salePrice")
            console.log(products);
        const brands = await Brand.find({ isBlocked: false });
        const categories = await Category.find({ isListed: true });
        
        res.render("shop", {
            user: userData,
            products: products,
            brands: brands,
            categories: categories
        });
    } catch (error) {
        console.log("Error loading shop page:", error);
        res.status(500).send("Server error");
    }
};


const loadLogin= async (req,res)=>{
    try{
        if(!req.session.user){
            return res.render("login")
        }else{
            const user = await User.findById(req.session.user)
            res.render("home",{user:user})
        }
    }catch(error){
        res.redirect("/pageNotFound")
    }
}

const loadSignin= async (req,res)=>{
    try{
        return res.render("Signup")

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

const signup= async (req,res)=>{
    
    try{
        const {name,phone,email,password,cpassword}= req.body

            if(password!==cpassword){
                return res.render("signup",{message:"Password not match"})
            }
        const findUser = await User.findOne({email})
        if(findUser){
            return res.render("signup",{message: "User with this email alredy exist"})
        }
        const otp= generateOtp()

        const emailSent= await sendVarificationEmail(email,otp)
        if(!emailSent){
            return res.json("email error")
        }
        req.session.userOtp=otp
        console.log("otp is",req.session.userOtp)
        req.session.userData={name,phone,email,password}
        res.render("verifyOtp")
        console.log("otp send",otp)

    }catch(error){
        console.error("Signup error",error)
        res.redirect("/pageNotFound")
    }
}

const securePassword= async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }

}
const loadVerifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log("Received OTP:", otp);
      
        console.log("Session User Data:", req.session.userData);


        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            });

            await saveUserData.save();
            req.session.user = saveUserData._id;

            // Clear session OTP and userData after successful verification
            delete req.session.otpInput;
            return res.json({ success: true, redirect: "/" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Error while verifying OTP:", error.message);
        return res.status(500).json({ success: false, message: "An error occurred while verifying OTP" });
    }
};

const login= async (req,res)=>{
    try {
        const {email,password}= req.body
        const findUser= await User.findOne({isAdmin:false, email:email})

        if(!findUser){
            return res.render("login",{message:"User not found"})
        }
if(findUser.isBlocked){
    return res.render("login",{message:"User is blocked by admin"})
}

const passwordMatch = await bcrypt.compare(password,findUser.password) 
if(!passwordMatch){
    return res.render("login",{message:"Incorrect password"})
}
req.session.user= findUser._id
res.redirect("/")



    } catch (error) {
        console.log("login error",error)
        res.render("login",{message:"Login failed please try again later"})
    }
}



//define logout function

const logout= async (req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("session destructure error",err.message)
                return res.redirect("/pageNotFound")
            }
            return res.redirect("/login")
        })
    } catch (error) {
        console.log("Logout error",error)
        res.redirect("/pageNotFound")
        
    }
}






module.exports={
    loadHomepage,
    PageNotFound,
    loadLogin,
    login,
    loadSignin,
    signup,
    loadVerifyOtp,
    logout,
    loadShopPage


}