var bodyParser = require("body-parser")
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var PORT = process.env.PORT || 3000;

var express = require("express");
var app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
app.use(
    bodyParser.urlencoded(
        { extended: true }
    )
);

// handlebars
var exphbs = require("express-handlebars");
app.engine( "handlebars", exphbs({defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/articlesdb", { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Connected to Mongoose!");
});


app.use(express.json());

// Make public a static folder
app.use(express.static(process.cwd() + "/public"));

var routes = require("./controller/controller.js");
app.use("/", routes);

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});