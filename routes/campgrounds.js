var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var User = require("../models/user");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var cloudinary = require('cloudinary');
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

// CLOUDINARY CONFIG
cloudinary.config({ 
    cloud_name: "shade", 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

// GEOCODER CONFIG
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// INDEX ROUTE
router.get("/campgrounds", function(req, res) {
    var noMatch = "";
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allCampgrounds){
            Campground.count().exec(function(err, count) {
                if(err) {
                    console.log(err);
                }
                else {
                    if(allCampgrounds.length < 1) {
                        noMatch= "No Campgrounds match that query, please try again";
                    }
                    res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch, current: pageNumber, pages: Math.ceil(count/perPage)});
                }
            })
        });
    }
    else {
        // Get all campgrounds from DB
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allCampgrounds) {
            Campground.count().exec(function(err, count) {
                if(err) {
                    console.log(err);
                }
                else {
                    res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch, current: pageNumber, pages: Math.ceil(count/perPage)});
                } 
            })
        });
    }
});

// NEW ROUTE
router.get("/campgrounds/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new"); 
});

//CREATE ROUTE
router.post("/campgrounds", middleware.isLoggedIn, upload.single("myImage"), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
        //get data from form and add to campgrounds array
        var name = req.body.name;
        var desc = req.body.description;
        var price = req.body.price;
        var author = {id: req.user._id, username: req.user.username};
        var image = result.secure_url;
        var rating = req.body.rating;
        var latitudine = req.body.lat;
        var longitudine = req.body.lng;

        geocoder.geocode(req.body.location, function (err, data) {
            if (err || !data.length) {
                req.flash('error', 'Invalid address');
                return res.redirect('back');
            }
            if(req.body.lat && req.body.lng) {
                var lat = req.body.lat;
                var lng = req.body.lng;
            }
            else {
                var lat = data[0].latitude;
                var lng = data[0].longitude;
            }
            var location = data[0].formattedAddress;
            // Create a new campground and save to DB
            var newCampground = {name: name, image: image, description: desc, author:author, location: location, lat: lat, lng: lng, rating: rating, latitudine: latitudine, longitudine: longitudine};
            Campground.create(newCampground, function(err, newlyCreated){
                if(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                } else {
                    req.flash("success", "Successfuly Created");
                    res.redirect("/campgrounds");
                }
            });
            // Send me a message when new Campground is added
            User.findById(req.user_id, function(err, user) {
                if(err) {
                    console.log(err);
                }
                else {
                    var smtpTransport = nodemailer.createTransport({
                        service: "Gmail",
                        auth: {
                            user: 'shadeswildcamps@gmail.com',
                            pass: process.env.GMAILPW
                          },
                          tls: { rejectUnauthorized: false} 
                    });
                    var mailOptions = {
                        to: "shadeswildcamps@gmail.com",
                        from: req.user.email,
                        subject: "New Campground added",
                        text: "New Campground added." +
                        "Check it Out!"
                    };
                    smtpTransport.sendMail(mailOptions, function(err) {
                        if(err) {
                            console.log(err);
                        }
                    });
                }
            })
        });
    });
});

// SHOW ROUTE
router.get("/campgrounds/:id", function(req, res) {
    // find the Camppground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
        if(err) {
            console.log(err);
        }
        else {
        // render how template with that campground
        res.render("campgrounds/show", {campground: foundCampground});
        }
    })
});

// EDIT ROUTE
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE ROUTE
router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, upload.single("myImage"), function(req, res) {
    console.log(req.body.myImage);
        cloudinary.uploader.upload(req.file.path, function(result) {
            var image = result.secure_url;
            geocoder.geocode(req.body.campground.location, function (err, data) {
                if (err || !data.length) {
                  req.flash('error', err.message);
                  return res.redirect('back');
                }
                if(req.body.lat && req.body.lng) {
                    var lat = req.body.lat;
                    var lng = req.body.lng;
                }
                else {
                    var lat = data[0].latitude;
                    var lng = data[0].longitude;
                }
                var location = data[0].formattedAddress;
                var updatedCampground = {name: req.body.campground.name, image: image, description: req.body.campground.description, location: location, lat: lat, lng: lng, rating: req.body.campground.rating, latitudine: req.body.campground.lat, longitudine: req.body.campground.lng};
                Campground.findByIdAndUpdate(req.params.id, updatedCampground, function(err, campground){
                    if(err){
                        req.flash("error", err.message);
                        res.redirect("back");
                    } else {
                        req.flash("success","Successfully Updated!");
                        res.redirect("/campgrounds/" + campground._id);
                    }
                });
            });
        });
    // else {
    //     geocoder.geocode(req.body.campground.location, function (err, data) {
    //         if (err || !data.length) {
    //           req.flash('error', err.message);
    //           return res.redirect('back');
    //         }
    //         if(req.body.lat && req.body.lng) {
    //             var lat = req.body.lat;
    //             var lng = req.body.lng;
    //         }
    //         else {
    //             var lat = data[0].latitude;
    //             var lng = data[0].longitude;
    //         }
    //         var location = data[0].formattedAddress;
    //         var updatedCampground = {name: req.body.campground.name, image: image, description: req.body.campground.description, location: location, lat: lat, lng: lng, rating: req.body.campground.rating};
    //         Campground.findByIdAndUpdate(req.params.id, updatedCampground, function(err, campground){
    //             if(err){
    //                 req.flash("error", err.message);
    //                 res.redirect("back");
    //             } else {
    //                 req.flash("success","Successfully Updated!");
    //                 res.redirect("/campgrounds/" + campground._id);
    //             }
    //         });
    //     });
    // }
})

// UPDATE CAMPGROUND SCORE
router.put("/campgrounds/:id/rating", middleware.isLoggedIn, function(req, res) {
    Campground.findByIdAndUpdate(req.params.id, function(err, updatedCampground){
        if(err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
        else {
            updatedCampground.rating.push(req.body.rating);
            updatedCampground.save();
            req.flash("success", "Thank you for the rating");
            res.redirect("/campgrounds/" + req.params.id);
        }
        
    })
})

// DESTROY ROUTE
router.delete("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            console.log(err);
            res.redirect("/campgrounds");
        }
        else {
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;