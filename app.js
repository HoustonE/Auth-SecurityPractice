/***
Ethan Houston
Authentication and Security Practice
2020-03
***/

//jshint esversion:6
require('dotenv').config();
var md5 = require('md5');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const dotenv = require('dotenv');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

//DB stuff
mongoose.connect("mongodb://localhost:27017/SecretsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});




// ---- USERDB

const userSchema =  new mongoose.Schema({
  email: String,
  password: String
});


const User = new mongoose.model("User", userSchema);


// REST ************

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
    const username = req.body.username;
    const password = md5(req.body.password);

    //Search for Usernamw
    //  - if exists -> check if password matches -> if match -> render secrets page
    // else log error
    User.findOne({
      email: username
    }, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          if (foundUser.password === password) {
            resp.render("secrets");
          } else {
            console.log("Incorrect Password entered");
          }
        } else {
          console.log("Incorrect Username or Password");
        }
      }
    });
  });


// -- register
app.route("/register")
  .get(function(req, resp) {
    resp.render("register");
  })
  .post(function(req, resp) {
    const newUser = new User({
      email: req.body.username,
      password: md5(req.body.password)
    });
    newUser.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        resp.render("secrets");
      }
    });
  });






app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
