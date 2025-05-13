const mongoose = require("mongoose")
const {Schema} = mongoose

const userSchema= new Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    
    profilePhoto: {
        type: String,
        default: '/Uploads/profile-images/default-profile.jpg' // Default image
    },
    phone:{
        type: String,
        required: false,
        unique: false,
        sparse: true,
        default :null
    },
    googleId:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    cart:[{
        type:Schema.Types.ObjectId,
        ref:"cart"
    }],
    wallet:{
        type:Number,
        default:0
    },
    wishList:[{
        type:Schema.Types.ObjectId,
        ref:"Wishlist"
    }],
    orderHistory:[{
        type: Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now()
    },
    referalCode:{
        type:String
    },
    redeemed:{
        type:Boolean
    },redeemedUsers:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    // searchHistory: [{
    //     category: {
    //         ref: "Category"
    //     },
    //     brand: {
    //         ref: "Brand"
    //     },
    //     searchOn: {
    //         type: Date,
    //         default: Date.now
    //     }
    // }]
})
const User= mongoose.model("User",userSchema)

module.exports = User