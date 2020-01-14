const express = require('express');
const router = express.Router();
const path = require('path');
const axios = require('axios');

const request = require('request');
const cheerio = require('cheerio');

const Comment = require('../models/comment.js');
const Article = require('../models/article.js');

router.get("/", function (req, res) {
    res.redirect("/articles")
});

router.get("/scrape", function (req, res) {
    axios.get("http://www.echojs.com/").then(function (response) {
        var $ = cheerio.load(response.data);
        var titlesArray = [];

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

            if (result.title !== "" && result.link !== "") {

                if (titlesArray.indexOf(result.title) == -1) {
                    titlesArray.push(result.title);

                    Article.count({ title: result.title }, function (err, test) {
                        if (test === 0) {
                            var entry = new Article(result);

                            entry.save(function (err, doc) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(doc);
                                }
                            })
                        }
                    })
                } else {
                    console.log("Article already exists.")
                }
            } else {
                console.log("Not saved to DB, missing data!");
            }
        });
        res.redirect("/");
    });
});

// Displays all articles - routes to index
router.get("/articles", function (req, res) {
    Article.find().sort({ _id: -1 }).exec(function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            var artcl = { article: doc };
            res.render("index", artcl);
        }
    });
});

// Display JSON objects for articles
router.get("/articles-json", function (req, res) {
    Article.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

// Used to clear out all JSON objects
router.get("/clearAll", function (req, res) {
    Article.remove({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("removed all articles");
        }
    });
    res.redirect("/articles-json");
});

// Display specific article
router.get("/readArticle/:id", function(req,res) {
    var articleId = req.params.id;
    var hbsObj = {
        article: [],
        body: []
    };

    Article.findOne({ _id: articleId})
    .populate("comment")
    .exec(function(err, doc) {
        if (err) {
            console.log("Error: " + err);
        } else {
            hbsObj.article = doc;
            var link = doc.link
            request(link, function(error, response, html) {
                var $ = cheerio.load(html);
                
                $("article h2").each(function (i, element) {
                    hbsObj.body = $(this)
                    .children("a")
                    .text();

                    res.render("article", hbsObj);
                    return false;
                });
            })
        }
    })
})


// Comment on an article
router.post("/comment/:id", function(req, res) {
    var user = req.body.name;
    var content = req.body.comment;
    var articleId = req.params.id;

    var commentObj = {
        name: user,
        body: content
    };

    var newComment = new Comment(commentObj);

    newComment.save(function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log(doc._id);
            console.log(articleId);

            Article.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { comment: doc._id } },
                { new: true }
            ).exec(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/readArticle/" + articleId);
                }
            });
        }
    });
});


module.exports = router;