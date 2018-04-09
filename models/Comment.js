var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    body: String,
    created: {
        type: Date,
        default: Date.now
    }
});

var Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;