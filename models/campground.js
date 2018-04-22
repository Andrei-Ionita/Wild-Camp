var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    location: String,
    lat: Number,
    lng: Number,
    latitudine: Number,
    longitudine: Number,
    description: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    price: Number,
    rating: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Campground", campgroundSchema);