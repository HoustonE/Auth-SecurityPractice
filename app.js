/***
Ethan Houston
Authentication and Security Practice
2020-03
***/

//jshint esversion:6
require('dotenv').config();
// var md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 5;
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

//Session
app.use(session({
  secret: "someweirdsecretthing.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//DB stuff
mongoose.connect("mongodb+srv://admin-HuStone:"+process.env.DBPASS+"@hustoneclust-ln4su.mongodb.net/secretsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

// ---- USERDB

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

//Passport
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//GoogleAuth2.0
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://rocky-wave-70995.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

//************ REST ************

// -- home
app.route("/")
  .get(function(req, resp) {
    resp.render("home");
  });

// -- login
app.route("/login")
  .get(function(req, resp) {
    resp.render("login");
  })
  .post(function(req, resp) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, resp, function() {
          resp.redirect("/secrets");
        });
      }
    });

    // const username = req.body.username;
    // const password = req.body.password;
    //
    // //Search for Usernamw
    // //  - if exists -> check if password matches -> if match -> render secrets page
    // // else log error
    // User.findOne({
    //   email: username
    // }, function(err, foundUser) {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     if (foundUser) {
    //       bcrypt.compare(password, foundUser.password, function(err, result){
    //         if(result === true){
    //           resp.render("secrets");
    //         } else {
    //           console.log("Incorrect Password entered");
    //         }
    //       });
    //     } else {
    //       console.log("Incorrect Username or Password");
    //     }
    //   }
    // });
  });


// -- register
app.route("/register")
  .get(function(req, resp) {
    resp.render("register");
  })
  .post(function(req, resp) {
    User.register({
      username: req.body.username
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        resp.redirect("/register");
      } else {
        passport.authenticate("local")(req, resp, function() {
          resp.redirect("/secrets");
        });
      }
    });

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //   const newUser = new User({
    //     email: req.body.username,
    //     password: hash
    //   });
    //   newUser.save(function(err) {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       resp.render("secrets");
    //     }
    //   });
    // });

  });


// -- secrets
app.route("/secrets")
  .get(function(req, resp){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if(err){
        console.log(err);
      } else{
        if (foundUsers){
          resp.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  });

// -- logout
app.route("/logout")
  .get(function(req, resp) {
    req.logout();
    resp.redirect("/");
  });

// -- GoogleAuth
app.route("/auth/google")
  .get(
    passport.authenticate("google", {
      scope: ["profile"]
    })
  );

app.route("/auth/google/secrets")
  .get(passport.authenticate('google', {
      failureRedirect: '/login'
    }),
    function(req, resp) {
      resp.redirect('/secrets');
    }
  );

// -- Submit
app.route("/submit")
  .get(function(req, resp) {
    if (req.isAuthenticated()) {
      resp.render("submit");
    } else {
      resp.redirect("/login");
    }
  })
  .post(function(req, resp){
    const newSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
      if (err){
        console.log(err);
      } else {
        foundUser.secret = newSecret;
        foundUser.save(function(){
          resp.redirect("/secrets");
        });
      }
    });

  });


  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 3000;
  }

  app.listen(port, function() {
    console.log("Server started successfully");
  });
