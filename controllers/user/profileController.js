const User= require("../../models/userSchema")
const env= require("dotenv").config()
const nodemailer= require("nodemailer")
const bcrypt = require("bcrypt")
const session= require('express-session')
const Address = require('../../models/addressSchema')
const Order = require("../../models/orderSchema")
const multer = require('multer');


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
    text:`Your otp is : ${otp}`,
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

const securerPassword=async(password)=>{
try {
    const passwordHash=await bcrypt.hash(password,10)
    return passwordHash
} catch (error) {
    console.error("Password hash error:", error);
    return null
    
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
                res.render("forgot-password",{
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
            
            res.json({success:true,redirectUrl:"/reset-password"})
        }else{
            res.json({success:false,message:"OTP not matching"})
        }
    } catch (error) {
        res.status(500).json({success:false,message:"An error occoured. please try again"})
        
    }
}
const getResetPassword = async (req, res) => {
    try {
        const userId = req.session.user;
        let userData = null;
        if (userId) {
            userData = await User.findById(userId);
        } else if (req.session.email) {

            userData = await User.findOne({ email: req.session.email });
        }
        res.render("reset-password", { user: userData, message: req.query.message || '' });
    } catch (error) {
        res.redirect("/pageNotFound");
    }
}
const resendOtp =  async(req,res)=>{
  
        try {
            const email = req.session.email
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email, otp)
            if (emailSent) {
                req.session.userOtp = otp 
                console.log("Resent OTP:", otp)
                console.log("Resent email:", emailSent)
                res.status(200).json({ success: true, message: "OTP resent successfully" });
            } else {
                res.json({ success: false, message: "Failed to resend OTP. Please try again." });
            }
    
        } catch (error) {
            console.error("Error while resending OTP:", error);
            res.status(500).json({ success: false, message: "An error occurred. Please try again later." });
        }
    };
    
const postNewPassword= async (req,res)=>{
    try {
        const {newPass1,newPass2}=req.body
        const email= req.session.email
        const userId = req.session.user

        
        if(newPass1===newPass2){
            const passwordHash = await securerPassword(newPass1)
          
            if (userId) {
                await User.findByIdAndUpdate(userId, { password: passwordHash });
            } else if (email) {
                await User.updateOne({ email: email }, { $set: { password: passwordHash } });
            }
            res.redirect("/login")
        }else{
            res.render("reset-password",{message:'Password do not match'})
        }
     
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}


async function userProfile(req, res) {
    try {
      const userId = req.session.user;
      const userData = await User.findById(userId);
      const addressData = await Address.findOne({ userId });
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const orders = await Order.find({ userId })
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
  
      const totalOrders = await Order.countDocuments({ userId });
      const totalPages = Math.ceil(totalOrders / limit);
  
      console.log("User ID:", userId);
      console.log("Total Orders:", totalOrders);
      console.log(
        "Fetched Orders:",
        orders.map((o) => ({ orderId: o.orderId, _id: o._id }))
      );
  
      res.render("profile", {
        user: userData,
        userAddress: addressData,
        orders,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error("Error while retrieving profile data:", error);
      res.redirect("/pageNotFound");
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

const changePasswordValid= async (req,res)=>{
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

const verifyChangePasswordOtp= async(req,res)=>{
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

const addAddress= async (req, res) => {
    try {
      const user = req.session.user
      res.render("addAddress",{user:user})
      
      
    } catch (error) {
      res.redirect("/pageNotFound")
    }
  }

 // Add new address
  const postAddAddress= async (req, res) => {
    try {
      
      const userId = req.session.user
      const userData= await User.findOne({_id:userId})
      const {addressType,name,city,landMark,state,pincode,phone,altPhone}=req.body
      
      
      const userAddress= await Address.findOne({userId:userData._id})
   
      if (!userAddress) {
       const newAddress= new Address({
        userId:userData._id,
        address:[{addressType,name,city,landMark,state,pincode,phone,altPhone}]
       })
       await newAddress.save()
      }else{
        userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone})
        await userAddress.save()
      }
      res.redirect('/userProfile')

    
    } catch (error) {
      console.error('Error adding address:', error);

      res.redirect('/pageNotFound');
    }
  }

//   Edit address
  const editAddress= async (req, res) => {
    try {
      
      const user = req.session.user
      const addressId= req.query.id
      const currAddress= await Address.findOne({
        "address._id":addressId
      })
      if(!currAddress){
        return res.redirect("/pageNotFound")
      }
      const addressData= currAddress.address.find((item)=>{
        return item._id.toString()===addressId.toString()
      })
      if(!addressData){
        return res.redirect("/pageNotFound")
      }
      res.render("editAddress",{address:addressData,user:user,isEditing:true})
      
    } catch (error) {
      console.error('Error updating address:', error);
      res.redirect("/pageNotFound");
    }
  }

const postEditAddress= async(req,res)=>{
  try {
    const data = req.body
    const addressId= req.query.addressId
    const user = req.session.user
    const findAddress= await Address.findOne({"address._id":addressId})
    if(!findAddress){
      res.redirect("/pageNotFound")
    }
    await Address.updateOne(
      {"address._id":addressId},{$set:{"address.$":{
        _id:addressId,
        type:data.type,
        name:data.name,
        street: data.street,
        city:data.city,
        landMark:data.landMark,
        state :data.state,
        pincode:data.pincode,
        phone:data.phone,
        altPhone:data.altPhone,

      }
    }}
    )
    res.redirect("/userProfile")

  } catch (error) {
    console.error("error in edit address",error)
    res.redirect("/pageNotFound")
    
  }

}



// Delete address
 const deleteAddress= async (req, res) => {
    try {
      const addressId = req.query.id;
      const user = await User.findById(req.session.userId);
      const findAddress=await Address.findOne({"address._id":addressId})
     if(!findAddress){
      return res.status(404).send("address not found")
     }

     await Address.updateOne(
      {"address._id":addressId},{$pull:{address:{_id:addressId}}})
  
      res.redirect('/userProfile');
    } catch (error) {
      console.error('Error deleting address:', error);
     
      res.redirect('/pageNotFound');
    }
  }

//   // Set an address as default
//   const setDefaultAddress= async (req, res) => {
//     try {
//       const addressId = req.params.id;
//       const user = await User.findById(req.session.userId);
      
//       if (!user) {
//         return res.redirect('/login');
//       }

//       // Reset all addresses to non-default
//       user.addresses.forEach(addr => {
//         addr.isDefault = false;
//       });

//       // Set the selected address as default
//       const address = user.addresses.id(addressId);
      
//       if (!address) {
//         req.flash('error', 'Address not found');
//         return res.redirect('/address');
//       }

//       address.isDefault = true;
//       await user.save();
      
//       req.flash('success', 'Default address updated');
//       res.redirect('/address');
//     } catch (error) {
//       console.error('Error setting default address:', error);
//       req.flash('error', 'Failed to update default address');
//       res.redirect('/address');
//     }
//   }

//   

//   
//   // Logout
//   const logout= (req, res) => {
//     req.session.destroy();
//     res.redirect('/login');
  
// };



const uploadProfilePhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Delete old profile photo if it exists and is not the default
        if (user.profilePhoto && user.profilePhoto !== "/Uploads/profile-images/default-profile.jpg") {
            const oldPhotoPath = path.join(__dirname, "../../public", user.profilePhoto);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        // Save new photo URL
        const photoUrl = `/Uploads/profile-images/${req.file.filename}`;
        user.profilePhoto = photoUrl;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile photo uploaded successfully",
            photoUrl,
        });
    } catch (error) {
        console.error("Error uploading profile photo:", error);
        // Clean up uploaded file on error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: error.message || "Failed to upload profile photo",
        });
    }
};



module.exports={
  
    PageNotFound,
    getForgotPassword,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassword,
    resendOtp,
    postNewPassword,
    userProfile,
    changeEmail,
    changeEmailValid,
    verifyEmailOtp,
    updateEmail,
    changePassword,
    changePasswordValid,
    verifyChangePasswordOtp,
    addAddress,
    postAddAddress,
    editAddress, 
    postEditAddress,
    deleteAddress,
    uploadProfilePhoto,
    







    
}