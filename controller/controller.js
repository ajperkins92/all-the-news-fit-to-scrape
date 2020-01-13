const express = require('express');
const router = express.Router();
const path = require('path');

const request = require('request');
const cheerio = require('cheerio');

const Comment = require('../models/comment');
const Article = require('../models/article');

router.get("/", function (req, res) {
    res.redirect("/articles")
});

router.get("/scrape", function (req, res) {
    axios.get("http://www.echojs.com/").then(function (response) {
        var $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $("article h2").each(function (i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });

        // Send a message to the client
        res.send("Scrape Complete");
    });
});

// Route for getting all Articles from the db
router.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .sort({ _id: -1 })
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

router.get("/articles-json", function(req, res) {
    Article.find({}, function(err, doc) {
        if (err){
            console.log(err);
        } else {
            res.json(doc)
        }
    });
});

module.exports = router;