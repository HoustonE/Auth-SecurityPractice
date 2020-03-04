/***
Ethan Houston
Authentication and Security Practice
2020-03
***/

//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended : true
}));


// REST ************

// -- home
app.route("/")
.get(function(req, resp){
  resp.render("home");
});

// -- login
app.route("/login")
.get(function(req, resp){
  resp.render("login");
});

// -- register
app.route("/register")
.get(function(req, resp){
  resp.render("register");
});







app.listen(3000, function(){
  console.log("Server started on port 3000.");
})
