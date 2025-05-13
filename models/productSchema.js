const mongoose= require("mongoose")
const {Schema}= mongoose

const productSchema= new Schema({
productName:{
    type:String,
    required:true,
    trim: true
},
description:{
    type:String,
    required:true
},
brand: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
    required: true
},
category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true
},
sizeVariants: {
    type: [{
    size: {
        type: String,
        required: true,
        trim: true,
        enum: ["S", "M", "L", "XL", "XXL"] 
    },
regularPrice:{
    type:Number,
    required:true
},
salePrice:{
    type:Number,
    required:true
},
productOffer:{
    type:Number,
    default:0

},
quantity:{
    type:Number,
    default:true
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
}],
required: true,
validate: {
    validator: function (arr) {
        return arr.length > 0;
    },
    message: "At least one size variant is required"
}
},
color:{
    type:String,
    required:true
},
productImage:{
    type: [String],
    required:true
}

},{timestamps:true})

const Product= mongoose.model("Product",productSchema)

module.exports= Product