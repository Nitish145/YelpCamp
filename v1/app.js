var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine" , "ejs")

var campgrounds = [
    {name : "Salmon Greek" , image : "https://farm9.staticflickr.com/8605/16573646931_22fc928bf9_o.jpg"},
    {name : "Granite Hill" , image : "https://www.michigan.org/sites/default/files/styles/15_6_desktop/public/camping-hero_0_0.jpg?itok=mgGs0-vw&timestamp=1520373602"},
    {name : "Mountain Goat's Rest" , image : "https://www.paperbarkcamp.com.au/sites/paperbarkcamp.com.au/files/styles/notcropped/public/Flash%20Camp%20Coolendel_5mod.jpg?itok=PEbZFodq"},
    {name : "Salmon Greek" , image : "https://farm9.staticflickr.com/8605/16573646931_22fc928bf9_o.jpg"},
    {name : "Granite Hill" , image : "https://www.michigan.org/sites/default/files/styles/15_6_desktop/public/camping-hero_0_0.jpg?itok=mgGs0-vw&timestamp=1520373602"},
    {name : "Mountain Goat's Rest" , image : "https://www.paperbarkcamp.com.au/sites/paperbarkcamp.com.au/files/styles/notcropped/public/Flash%20Camp%20Coolendel_5mod.jpg?itok=PEbZFodq"},
    {name : "Salmon Greek" , image : "https://farm9.staticflickr.com/8605/16573646931_22fc928bf9_o.jpg"},
    {name : "Granite Hill" , image : "https://www.michigan.org/sites/default/files/styles/15_6_desktop/public/camping-hero_0_0.jpg?itok=mgGs0-vw&timestamp=1520373602"},
    {name : "Mountain Goat's Rest" , image : "https://www.paperbarkcamp.com.au/sites/paperbarkcamp.com.au/files/styles/notcropped/public/Flash%20Camp%20Coolendel_5mod.jpg?itok=PEbZFodq"},
]

app.get("/" , function(req , res){
    res.render("landing");
})

app.get("/campgrounds" , function(req , res){ 
    res.render("campgrounds" , {campgrounds : campgrounds});
})

app.post("/campgrounds" , function(req , res){
    var name = req.body.name;
    var image = req.body.image;
    var newCampground = {
        name: name,
        image: image
    };
    campgrounds.push(newCampground);
    res.redirect("/campgrounds");
    })

app.get("/campgrounds/new" , function(req , res){
    res.render("new");
})

app.listen(3000 , function(){
    console.log("The YelpCamp Server has started");
})