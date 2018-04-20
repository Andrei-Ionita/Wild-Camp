var Campground = require("../models/campground");
var Comment = require("../models/comment");
var User = require("../models/user");
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next) {
    if(req.isAuthenticated()) {
        Campground.findById(req.params.id, function(err, foundCampground) {
            if(err) {
                req.flash("error", "Campground not found");
                console.log(err);
                return res.redirect("back");
            }
            if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            }
            else {
                req.flash("error", "You don't have permisson to do that");
                res.redirect("back");
            } 
        });
    }
    else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back")
    } 
};

middlewareObj.checkCommentOwnership = function(req, res, next) {
    if(req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if(err) {
                req.flash("error", "Comment not found!");
                console.log(err);
                return res.redirect("back");
            }
            if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            }
            else {
                req.flash("error", "You don't have permission to do that!");
                res.redirect("back");
            } 
        });
    }
    else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back")
    } 
};

middlewareObj.checkPageOwnership = function(req, res, next) {
    if(req.isAuthenticated()) {
        User.findById(req.params.id, function(err, foundUser) {
            if(err) {
                req.flash("error", "User not Found");
                console.log(err);
                return res.redirect("back");
            }
            if(foundUser._id.equals(req.user._id) || req.user.isAdmin) {
                next();
            }
            else {
                req.flash("error", "You don't have permission to do that!");
                res.redirect("back");
            } 
        });
    }
    else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back")
    } 
};

middlewareObj.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("/login");
};

module.exports = middlewareObj;