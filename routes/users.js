const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

// mongoose.connect("mongodb://127.0.0.1:27017/instaclone");
mongoose.connect("mongodb+srv://yneeraj082r:9mtXq8qyIfaZUVeA@instacluster.yldfdt6.mongodb.net/mongodb?retryWrites=true&w=majority")

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