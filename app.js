var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require('passport');
var LocalStrategy = require('passport-local');
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require('./models/user');
var methodOveride = require("method-override");
var flash = require("connect-flash");

mongoose.connect("mongodb+srv://Nitish:Aggarwals@123@cluster0-qlhyo.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true, useFindAndModify: false });
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(flash());

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
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

app.use(express.static(__dirname + "/public"))
app.use(methodOveride("_method"));

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
        res.render("campgrounds/campgrounds", { campgrounds: allCampgrounds });
    })
})

app.post("/campgrounds", isLoggedIn, function (req, res) {
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username,
    }

    var newCampground = {
        name: name,
        price: price,
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

app.get("/campgrounds/new", isLoggedIn, function (req, res) {
    res.render("campgrounds/new");
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

app.get("/campgrounds/:id/edit", checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        res.render("campgrounds/edit.ejs", { campground: foundCampground });
    })
})

app.put("/campgrounds/:id", checkCampgroundOwnership, function (req, res) {
    //find and update 
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, updatedCampground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds/" + req.params.id)
        }
    })
})

app.delete("/campgrounds/:id", checkCampgroundOwnership, function (req, res) {
    Campground.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
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

app.post("/campgrounds/:id/comments", isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    req.flash("error" , "Something went wrong");
                    console.log(err);
                } else {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success" , "Successfully added Comment");
                    res.redirect("/campgrounds/" + campground._id);
                }
            })
        }
    })
})

app.get("/campgrounds/:id/comments/:comment_id/edit", checkCommentOwnership, function (req, res) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
        if (err) {
            res.redirect("back");
        } else {
            res.render("comments/edit", { campground_id: req.params.id, comment: foundComment });
        }
    })
})

app.put("/campgrounds/:id/comments/:comment_id", checkCommentOwnership, function (req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedComment) {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
})

app.delete("/campgrounds/:id/comments/:comment_id", checkCommentOwnership, function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
        if (err) {
            res.redirect("back");
        } else {
            req.flash("success" , "Comment deleted!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username })
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash("error" , err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success" , "Welcome to YelpCamp " + user.username);
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

app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/campgrounds");
})

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error" , "You need to be logged in to do that");
    res.redirect("/login");
}

function checkCampgroundOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id, function (err, foundCampground) {
            if (err) {
                req.flash("error" , "Campground not found")
                res.redirect("back");
            } else {
                if (foundCampground.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error" , "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        })
    }else{
        req.flash("error" , "You need to be logged in to do that");
        res.redirect("back");
    }
}

function checkCommentOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err) {
                res.redirect("back");
            } else {
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error" , "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        })
    } else {
        req.flash("error" , "You need to be logged in to do that");
        res.redirect("back");
    }
}

app.listen(3000, function () {
    console.log("The YelpCamp Server has started");
})