

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


module.exports={
    loadHomepage,
    PageNotFound
}