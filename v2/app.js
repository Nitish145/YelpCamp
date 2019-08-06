var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/yelp_camp" , { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine" , "ejs");

//SCHEMA SETUP
var campgroundSchema = new mongoose.Schema({
    name: String,
    image: String,
})

var Campground = mongoose.model("Campground" , campgroundSchema);

Campground.deleteOne({name: "Granite Hill"} , function(err){
    console.log("Deleted Successfully");
});

app.get("/" , function(req , res){
    res.render("landing"); 
})

app.get("/campgrounds" , function(req , res){ 
    //find all campgrounds stored in database
    Campground.find({} , function(err , allCampgrounds){
        if(err){
            console.log("Something Went Wrong");
            console.log(err);
        }else{
            console.log("Retrieved All Campgrounds");
        }
        res.render("campgrounds" , {campgrounds : allCampgrounds});
    })
})

app.post("/campgrounds" , function(req , res){
    var name = req.body.name;
    var image = req.body.image;
    var newCampground = {
        name: name,
        image: image
    };

    //Create a new campground and save it to the DB
    Campground.create(    
        newCampground,
        function(err , campground){
            if(err){
                console.log("Something Went Wrong!!");
            }else{
                res.redirect("/campgrounds");
            }
        }
    )
    })

app.get("/campgrounds/new" , function(req , res){
    res.render("new");
})

app.listen(3000 , function(){
    console.log("The YelpCamp Server has started");
})