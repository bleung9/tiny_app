var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890123456789";
  let str = "";
  for (i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * 72)];
  }
  return str;
}

//require the body library to parse the body into a string (req.body)
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//when URL is /urls/new, render the stuff on urls_new.ejs.  urls_new is a form which
//allows entry of new URL's.  upon submitting, it'll route to app.post("/urls")
//this must come before app.get("/urls/:shortURL") b/c urls/new is a subset of that!!!!!!
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

///when URL is urls/:shortURL, render the urls_show.ejs file
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// if user types /u/:shortURL, redirect to the longURL (for something that exists in database already)
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//upon receiving a new submission on urls_new,
//store that new URL in a database w/ an alphanumeric ID
//redirect to `/urls/${short}`, which routes to app.get("/urls/:shortURL")
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
});

//upon receiving a updated submission on urls_show,
//store that new URL in a database w/ an alphanumeric ID
//redirect to `/urls/${short}`, which routes to app.get("/urls/:shortURL")
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

// POST route to remove a resource at "/urls/:shortURL/delete and redirect to /urls (app.get("/urls")"
app.post("/urls/:shortURL/delete", (req, res) => {
  let short = req.params.shortURL;
  delete urlDatabase[short];
  res.redirect("/urls");
});

//when URL is /urls, load the urls_index page w/ list of URL's in the database
app.get("/urls", (req, res) => {
  let templateVars = {urls:urlDatabase};
  res.render("urls_index", templateVars);
})

app.get("/", (req, res) => {
  res.send("Hello!");
});

//display the urlDatabase array of objects
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//output hello world in bold
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});