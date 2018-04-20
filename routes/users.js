var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var User = require("../models/user");
var passport = require("passport");
var middleware = require("../middleware");

// USERS PROFILE PAGE
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id).populate("favCamps").exec(function(err, foundUser) {
        if(err) {
            req.flash("error", "Something went wrong!");
            res.redirect("back");
        }
        else {
            Campground.find().where('author.id').equals(foundUser._id).exec(function(err, foundCampgrounds) {
                if(err) {
                    req.flash("error", "Something went wrong!");
                    res.redirect("back");
                }
                else {
                    res.render("users/show", {user: foundUser, campgrounds: foundCampgrounds});
                }
            })
        }
    })
});

// EDIT USER'S PAGE ROUTE
router.get("/users/:id/edit", middleware.checkPageOwnership,  function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if(err) {
            console.log(err);
            req.flash("error", err.message);
            res.render("back");
        }
        res.render("users/edit", {user: foundUser});
    })
});

router.put("/users/:id",middleware.checkPageOwnership, function(req, res) {
    var description = req.body.description;
    User.findByIdAndUpdate(req.params.id, {description: description}, function(err, foundUser) {
        if(err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
        req.flash("success", "Successfuly Updated");
        res.redirect("/users/" + foundUser._id);
    })
});

// ADD CAMPGROUND TO FAVORITES
router.put("/campgrounds/:id/favorite", middleware.isLoggedIn, function(req, res) {
    User.findById(req.user._id, function(err, user) {
        if(err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
        else {
            Campground.findById(req.params.id, function(err, campground) {
                if(err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                }
                else {
                    user.favCamps.push(campground);
                    user.save();
                    res.redirect("/campgrounds/" + req.params.id);
                }
            })
        }
    })
})

// DELETE CAMPGROUND FROM FAVORITES 
router.put("/users/:id/deleteCamp", function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if(err) {
            console.log(err);
            res.redirect("back");
        }
        else {
            user.favCamps.forEach(function(camp) {
                if(camp.equals(req.body.deleteCampground)) {
                    user.favCamps.splice(user.favCamps.indexOf(camp), 1)
                }
                user.save();
            })
            res.redirect("/users/" + user._id);
        }
    })
})

module.exports = router;