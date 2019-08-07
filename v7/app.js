var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require('passport');
var LocalStrategy = require('passport-local');
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require('./models/user')
var seedDB = require("./seeds");

mongoose.connect("mongodb://localhost/yelp_camp", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

seedDB();

//Passport configuration
app.use(require("express-session")({
    secret: "Once again rusty wins",
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
})

app.get("/", function (req, res) {
    res.render("landing");
})

app.get("/campgrounds", function (req, res) {
    //find all campgrounds stored in database
    Campground.find({}, function (err, allCampgrounds) {
        if (err) {
            console.log("Something Went Wrong");
            console.log(err);
        } else {
            console.log("Retrieved All Campgrounds");
        }
        res.render("campgrounds/campgrounds", { campgrounds: allCampgrounds});
    })
})

app.post("/campgrounds", isLoggedIn,  function (req, res) {
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username,
    }

    var newCampground = {
        name: name,
        image: image,
        description: description,
        author: author,
    };

    //Create a new campground and save it to the DB
    Campground.create(
        newCampground,
        function (err, campground) {
            if (err) {
                console.log("Something Went Wrong!!");
            } else {
                res.redirect("/campgrounds");
            }
        }
    )
})

app.get("/campgrounds/:id", function (req, res) {
    //find the campground with the provided id
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err) {
            console.log("Something Went Wrong!!");
            console.log(err);
        } else {
            res.render("campgrounds/show", { campground: foundCampground });
        }
    })
})

app.get("/campgrounds/:id/comments/new", isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log("Something Went Wrong!!");
            console.log(err);
        } else {
            res.render("comments/new", { campground: foundCampground });
        }
    });
});

app.post("campgrounds/:id/comments", isLoggedIn , function (req, res) {
    Campground.findById(req.body.id, function (err, campground) {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    //add username and id to the comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect("/campgrounds/" + campground._id);
                }
            })
        }
    })
})

app.get("/campgrounds/new", isLoggedIn , function (req, res) {
    res.render("campgrounds/new");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username })
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/campgrounds");
        })
    })
})

app.get("/login", function (req, res) {
    res.render("login");
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function (req, res) {

})

app.get("/logout" , function(req, res){
    req.logOut();
    res.redirect("/campgrounds");
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(3000, function () {
    console.log("The YelpCamp Server has started");
})