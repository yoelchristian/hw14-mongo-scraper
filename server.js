var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require("express-handlebars");
var mongoose = require('mongoose');
var request = require('request'); 
var cheerio = require('cheerio');
var app = express();

var db = require("./models");
var PORT = process.env.PORT || 8080;

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/homework-14";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
    useMongoClient: true
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get("/", function(req, res) {
    db.Article.find({}).populate("comments").then(function(dbArticle) {
        res.render("index", {title: "NHL Scraper", articles: dbArticle})
    })
})

app.get("/scrape", function(req, res) {
    request("https://www.nhl.com/", function(error, response, html) {
        var $ = cheerio.load(html);

        $("div.mixed-feed__item-header-text > a").each(function(i, element) {
            var result = {};

            result.title = $(element).children().first().text();
            result.subtitle = $(element).children().eq(1).text();
            result.link = "https://www.nhl.com/" + $(element).attr("href");
            db.Article.find({"title": result.title}).then(function(findResult) {
                if(!findResult.length) {
                    db.Article.create(result).then(function(dbArticle) {
                        console.log(dbArticle);
                    })
                }
            })     
        })
    });
    res.redirect("/");
});

app.get("/articles", function(req, res) {
    db.Article.find({}).then(function(dbArticle) {
        res.json(dbArticle);
    });
})

app.get("/articles/:id", function(req, res) {
    db.Article.findOne({_id: req.params.id}).populate("comments").then(function(dbArticle) {
        console.log(dbArticle)
        res.render("single", {articles: dbArticle});
    })
})

app.post("/articles/:id", function(req, res) {
    db.Comment.create({body: req.body.comment}).then(function(dbComment) {
        return db.Article.findOneAndUpdate({_id: req.params.id}, {$push: {comments: dbComment._id}}, {new: true})
    }).then(function(dbArticle) {
        res.redirect("/");
    });
})

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});