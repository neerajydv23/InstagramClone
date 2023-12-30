const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

// mongoose.connect("mongodb://127.0.0.1:27017/instaclone");
mongoose.connect("mongodb+srv://yneeraj082:neeraj@cluster0.gf8xdxr.mongodb.net/")

const userSchema = mongoose.Schema({
  username:String,
  name:String,
  email:String,
  password:String,
  profileImage:String,
  bio:String,
  posts:[{type:mongoose.Schema.Types.ObjectId,ref:"post"}],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
});

userSchema.plugin(plm);

module.exports=mongoose.model("user",userSchema);