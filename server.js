var express = require("express");
var app = express();
var path = require('path');
var mongoose = require('mongoose');

var port = process.env.PORT || 8080;
// var mongoURL = 'mongodb://127.0.0.1:27017/data';
var mongoURL = process.env.MONGOLAB_URI;
var reURLhead = /^https?:$/;
var reURLbody = /^\/\/[www]?[\S]*[a-z]{2,5}\/?[\S]*/;
var host;
var blah = "/new/http://www.blah.com/blah";
var renderTitle = {
    noURL: "Oops! You\'ve forgotten something!",
    success: "Oh yeah...",
    invalidURL: "Error: Invalid URL!"
};
var renderMsg = {
    domainTaken: "Error: Domain already taken!",
    success: "Success! Just take note of your shortened URL",
    invalid: "Please key in an URL with the following format:",
};
var renderCode = `http://${host}${blah}`;

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var URL = mongoose.model("URL", new Schema({
    id: ObjectId,
    originalURL: String,
    shortURL: String
}));

mongoose.connect(mongoURL);

app.use(express.static(path.join(__dirname, 'templates')));
// app.use('/styles', express.static(path.join(__dirname, 'templates')));
app.use(function(req, res, next) {
   host = req.get('host');
   next();
});
// do this after adding routes.js;
/*app.use(function(req, res, next) {
    res.status(404).send("Sorry, the page is not found. kthnxbai."); 
    next();
});*/

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

app.get('/', function(req, res) {
    host = req.get('host');
    res.render("homepage.ejs", { host: host });
});

app.get("/new/:head*", function(req, res) {
    var head = req.params.head.match(reURLhead);
    var body = req.params['0'].match(reURLbody);
    // var host = req.get('host');
    if (head && body) {
            var link = new URL({
                originalURL: head + body,
                shortURL: Math.floor(Math.random() * 10000).toString()
            });
            link.save(function(err, data) {
                if (err) {
                    res.render('new.ejs', { title: renderTitle.invalidURL, msg: renderMsg.domainTaken, code: ''});
                } else {
                    res.render("new.ejs", { title: renderTitle.success, msg: renderMsg.success, 
                    code: JSON.stringify({"original": link.originalURL, "shortened": "http://" + host +"/" + link.shortURL})
                    });                    
                    console.log(data.shortURL, data.originalURL);
                }
            });
    } else {
        res.render("new.ejs", { title: renderTitle.invalidURL, msg: renderMsg.invalid, code: renderCode});
    }
});

app.get("/new/:stuff", function(req, res) {
    // var host = req.get('host');
    res.render("new.ejs", { title: renderTitle.invalidURL, msg: renderMsg.invalid, code: renderCode }); 
});

app.get("/new", function(req, res) {
    // var host = req.get('host');
    res.render("new.ejs", { title: renderTitle.noURL, msg: renderMsg.invalid, code: renderCode});
});

app.get("/:url", function(req, res) {
    console.log(req.params);
    // console.log(req.params.url);
    URL.findOne({ shortURL : req.params.url}, function(err, data) {
        if (err) {
            console.log("Error is: " + err);
        }
        // var host = req.get('host');
        if (!data) {
            res.send("Error: URL not found! Please visit http://" + host + " for more info");
        } else {
            res.redirect(301, data.originalURL);
        }
    });
});

app.listen(process.env.PORT, function() {
  console.log("You are listening on port: " + port);
});