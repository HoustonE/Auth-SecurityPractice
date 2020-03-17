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
mongoose.connect("mongodb://localhost:27017/SecretsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

// ---- USERDB

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//Passport
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
  .get(function(req, resp) {
    if (req.isAuthenticated()) {
      resp.render("secrets");
    } else {
      resp.redirect("/login");
    }
  });

// -- logout
app.route("/logout")
  .get(function(req, resp) {
    req.logout();
    resp.redirect("/");
  });

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
