require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var User = require("./models/user");
var seedDB = require("./seeds");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride = require("method-override");
var moment = require("moment");
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;

var commentsRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var authRoutes = require("./routes/auth");
var userRoutes = require("./routes/users");
var contactRoutes = require("./routes/contact");

var app = express();
var dbPassword = process.env.MONGODB_PSW;
var urlDB = process.env.MONGODB_URI;
MongoClient.connect("mongodb://shade1989:shade1989.@ds151259.mlab.com:51259/wild_camps", function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
        console.log('Connection established to', urlDB);
        }
});
// mongoose.connect("mongodb://shade1989:" + mLabDBpsw + "@ds151259.mlab.com:51259/wild_camps");
// mongoose.connect("mongodb://andreiionita:" + dbPassword + "@data-shard-00-00-jnwq0.mongodb.net:27017,data-shard-00-01-jnwq0.mongodb.net:27017,data-shard-00-02-jnwq0.mongodb.net:27017/WildCampdb?ssl=true&replicaSet=data-shard-0&authSource=admin")
    
// mongoose.connect("mongodb://localhost/locuri_campare");

// SEED THE DB
// seedDB();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = moment;

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Hiking is the best",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// REQUIRING ROUTES
app.use(authRoutes);
app.use(campgroundRoutes);
app.use(commentsRoutes);
app.use(userRoutes);
app.use(contactRoutes);

app.listen(process.env.PORT || 3000, function(){
    console.log("Server is listening...");
})