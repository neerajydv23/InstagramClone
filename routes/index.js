var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require('passport-local');
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res) {
  res.render('index', {footer: false,error: req.flash('error')});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false,error:req.flash('error')});
});

router.get('/feed', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user});
  const posts = await postModel.find().populate("user");
  res.render('feed', {footer: true,posts,user});
});

router.get('/profile', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  res.render('profile', {user,footer: true});
});

router.get('/search', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  res.render('search', {footer: true,user});
});

router.get('/like/post/:id', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.findOne({_id:req.params.id});

  // if already liked, remove like
  // else like the post

  if(post.likes.indexOf(user._id)===-1){
    post.likes.push(user._id);
  }
  else{
    post.likes.splice(post.likes.indexOf(user._id),1);
  }

  await post.save();
  res.redirect('/feed');
});

router.get('/edit', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user});
  res.render('edit', {user,footer: true});
});

router.get('/upload', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username:req.session.passport.user});
  res.render('upload', {footer: true,user});
});

router.get('/username/:username', isLoggedIn, async function(req, res) {
  const regex = new RegExp(`^${req.params.username}`,'i');
  const users = await userModel.find({username:regex});
  res.json(users);
});

router.get('/profile/:username', isLoggedIn, async function(req,res){
  const followerUser = await userModel.findOne({username:req.params.username}).populate("posts");
  const user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  res.render("othersProfile",{user,followerUser,footer: true});
})

router.post('/register',function(req,res,next){

  if (!req.body.username || !req.body.name || !req.body.email || !req.body.password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/');
  }

  const userData = new userModel({  
    username:req.body.username,
    name:req.body.name,
    email:req.body.email,
  });

  userModel.register(userData,req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })
  .catch(function (err) {
    // Handle registration failure (e.g., username/email already taken)
    req.flash('error', 'Registration failed. Please choose a different username or email.');
    res.redirect('/');
  });
});

router.post('/login', passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/login",
  failureFlash:true
}), function(req,res){
});

router.get('/logout', function(req,res,next){
  req.logout(function(err){
    if(err){return next(err);}
    res.redirect('/');
  });
})

router.post("/update", upload.single("image"), async function(req,res){
  const user = await userModel.findOneAndUpdate(
    {username:req.session.passport.user},
    {username: req.body.username, name:req.body.name, bio:req.body.bio},
    {new: true}
    );

    if(req.file){
      user.profileImage = req.file.filename;
    }
    await user.save();
    res.redirect('/profile');
});

router.post("/upload", isLoggedIn, upload.single("image"), async function(req,res){
  const user = await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.create({
    picture: req.file.filename,
    user:user._id,
    caption:req.body.caption
  })

  user.posts.push(post._id);
  await user.save();
  res.redirect("/feed");
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Code for follow unfollow route 
router.get('/follow/:username', isLoggedIn, async function(req, res) {
  try {
    const currentUser = await userModel.findOne({ username: req.session.passport.user });
    const otherUser = await userModel.findOne({ username: req.params.username });

    // Check if the current user is already following the other user
    const isFollowing = currentUser.following.includes(otherUser._id);

    if (isFollowing) {
      // If already following, unfollow
      currentUser.following.pull(otherUser._id);
      otherUser.followers.pull(currentUser._id);
    } else {
      // If not following, follow
      currentUser.following.push(otherUser._id);
      otherUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await otherUser.save();

    res.redirect(`/profile/${req.params.username}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
