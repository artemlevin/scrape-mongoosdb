var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var request = require("request");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/mongoosScraper", { useNewUrlParser: true });

// Routes


// A GET route for scraping the NYT website
app.get("/scrape", (req, res) => {
    console.log("scrape ran")
        // First, we grab the body of the html with request
    request("https://www.nytimes.com/section/world?action=click&module=Well&pgtype=Homepage", (error, response, body) => {
        if (!error && response.statusCode === 200) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            const $ = cheerio.load(body);
            let count = 0;
            // Now, we grab every article:
            $('li.css-ye6x8s').each(function(i, element) {
                // Save an empty result object
                let count = i;
                let result = {};

                // Add the text and href of every link, and summary and byline, saving them to object
                result.title = $(element)
                    .find('div.css-4jyr1y')
                    .find('a h2')
                    .text().trim();
                console.log(result.title);
                link1 = $(element)

                .find('div.css-4jyr1y')
                    .find('a')
                    .attr("href");
                result.link = "https://www.nytimes.com" + link1;
                console.log(result.link);
                result.summary = $(element)

                .find('div.css-4jyr1y')
                    .find('a p')
                    .text().trim();
                console.log(result.summary)



                if (result.title && result.link && result.summary) {
                    // Create a new Article using the `result` object built from scraping, but only if both values are present
                    db.Article.create(result)
                        .then(function(dbArticle) {
                            // View the added result in the console
                            count++;
                        })
                        .catch(function(err) {
                            // If an error occurred, send it to the client
                            return res.json(err);
                        });
                };
            });
            // If we were able to successfully scrape and save an Article, redirect to index
            res.redirect('/')
        } else if (error || response.statusCode != 200) {
            res.send("Error: Unable to obtain new articles")
        }
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
    db.Article.find({})
        .then(function(dbArticle) {
            // If all Notes are successfully found, send them back to the client
            res.json(dbArticle);
        })
        .catch(function(err) {
            // If an error occurs, send the error back to the client
            res.json(err);
        });
    // TODO: Finish the route so it grabs all of the articles
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    db.Article.find({
            _id: req.params.id
        })
        .populate("note")
        .then(function(dbArticle) {
            res.json(dbArticle)
        }).catch(function(err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
    // TODO
    // ====
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with "note",
    // then responds with the article with the note included
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
        .then(function(dbNote) {
            // If a Note was created successfully, find one User (there's only one) and push the new Note's _id to the User's `notes` array
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function(dbNote) {
            // If the User was updated successfully, send it back to the client
            res.json(dbNote);
        })
        .catch(function(err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
    // TODO
    // ====
    // save the new note that gets posted to the Notes collection
    // then find an article from the req.params.id
    // and update it's "note" property with the _id of the new note
});

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});