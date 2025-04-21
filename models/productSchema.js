const mongoose= require("mongoose")
const {Schema}= mongoose

const productSchema= new Schema({
productName:{
    type:String,
    required:true
},
description:{
    type:String,
    required:true
},
brand:{
    type:String,
    required:true
},
category:{
    type:String,
    ref:"Category",
    required:true
},
regularPrice:{
    type:Number,
    reqeuired:true
},
salePrice:{
    type:Number,
    requireed:true
},
productOffer:{
    type:Number,
    default:0

},
quanitiy:{
    type:Number,
    default:true
},
color:{
    type:String,
    required:true
},
productImage:{
    type:[string],
    required:true
},
isBlocked:{
    type:Boolean,
    default:false
},
status:{
    type:String,
    enum:["Available","Out of Stock","Discontinued"],
    default:"Available"
},

},{timestamps:true})

const Product= mongoose.model("Product",productSchema)

module.exports= Product