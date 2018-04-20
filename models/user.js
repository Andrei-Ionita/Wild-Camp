var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema( {
    username: {type: String, unique: true, required: true},
    password: String,
    avatar: {type: String, default:     "https://www.scottsdaleazestateplanning.com/wp-content/uploads/2018/01/user.png"},
    firstName: String,
    lastName: String,
    description: String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {
        type: Boolean,
        default: false
    },
    favCamps: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campground"
        }
    ]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);