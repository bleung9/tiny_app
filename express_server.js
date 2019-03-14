var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
var PORT = 8080; // default port 8080

//require the body library to parse the body into a string (req.body)
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}))

app.use(cookieParser());

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890123456789";
  let str = "";
  for (i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * 72)];
  }
  return str;
}

//when URL is /urls/new, render the stuff on urls_new.ejs.  urls_new is a form which
//allows entry of new URL's.  upon submitting, it'll route to app.post("/urls")
//this must come before app.get("/urls/:shortURL") b/c urls/new is a subset of that!!!!!!
app.get("/urls/new", (req, res) => {
  let templateVars = { };
  if (!templateVars.username) {
    templateVars.username = req.cookies["username"];
  }
  res.render("urls_new", templateVars);
});

///when URL is urls/:shortURL, render the urls_show.ejs file
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  if (!templateVars.username) {
    templateVars.username = req.cookies["username"];
  }
  res.render("urls_show", templateVars);
});

// if user types /u/:shortURL, redirect to the longURL (for something that exists in database already)
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//take a username from the login form, and set it to res.cookie
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

//take a username from the logout form, and set it to res.cookie
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = { };
  if (!templateVars.username) {
    templateVars.username = req.cookies["username"];
  }
  res.render("urls_email", templateVars);
});

//return false if email has been registered already, true if it hasn't
function emailLookup(email) {
  for (user in users) {
    if (users[user].email === email) {
      return false;
    }
  }
  return true;
}

//takes in data from registration form and if the email and password are valid (don't exist, non-empty fields)
//it stores that data in the users object (database), and sets the cookies to the registration parameters
app.post("/register", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  if (!req.body.email || !req.body.password) {
    res.status(400).send("EITHER EMAIL OR PASSWORD IS EMPTY, TRY AGAIN PLEASE!");
  }
  if (emailLookup(req.body.email)) {
    let newId = generateRandomString();
    users[newId] = {
      id: newId,
      email: req.body.email,
      password: req.body.password
    }
    res.cookie("user_id", newId);
    res.redirect("/urls");
  }
  else {
    res.status(400).send("EMAIL HAS BEEN REGISTERED ALREADY!");
  }
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
  let templateVars = {
    username: req.cookies["username"],
    urls:urlDatabase
  };
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