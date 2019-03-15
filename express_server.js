var express = require("express");
var cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
var app = express();
var PORT = 8080; // default port 8080

//require the body library to parse the body into a string (req.body)
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}))

//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["I", "have", "no", "idea", "what", "the", "hell", "is", "happening", "lulz"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set("view engine", "ejs");

// var urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "a61azw": "http://www.google.com"
// };

const urlDatabase = {
  // b2xVn2: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  // a61azw: { longURL: "https://www.google.ca", userID: "aJ48l"},
  // j1870c: { longURL: "https://www.reddit.com", userID: "aJ48lW"}
};

const users = {
 //  "userRandomID": {
 //    id: "userRandomID",
 //    email: "user@example.com",
 //    password: "purple-monkey-dinosaur"
 //  },
 // "user2RandomID": {
 //    id: "user2RandomID",
 //    email: "user2@example.com",
 //    password: "dishwasher-funk"
 //  },
 //  "aJ48lW": {
 //    id: "aJ48lW",
 //    email: "user3@example.com",
 //    password: "funk"
 //  }
}

function generateRandomString() {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890123456789";
  let str = "";
  for (i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * 72)];
  }
  return str;
}

//return the ID of a user if email has been registered already, true if it hasn't
function emailLookup(email) {
  for (user in users) {
    if (users[user].email === email) {
      // console.log(user);
      // console.log(users[user].email);
      // console.log(email);
      return user;
    }
  }
  return true;
}

//this returns a list of long URL's in the database for a particular user ID
function urlsForUser(id) {
  let urlArray = [];
  for (urlId in urlDatabase) {
    if (id == urlDatabase[urlId].userID) {
      urlArray.push(urlDatabase[urlId].longURL);
    }
  }
  return urlArray;
}

//when URL is /urls/new, render the stuff on urls_new.ejs.  urls_new is a form which
//allows entry of new URL's.  upon submitting, it'll route to app.post("/urls")
//this must come before app.get("/urls/:shortURL") b/c urls/new is a subset of that!!!!!!
//if no one is logged in and you try to acccess /urls/new, it'll redirect you to login screen.
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  }
  else {
    let templateVars = { username: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

///when entered or redirected URL is urls/:shortURL, render the urls_show.ejs file
app.get("/urls/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    username: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

// if user types /u/:shortURL, redirect to the longURL (for something that exists in database already)
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//check for valid login.  if valid, log the user in and set cookie to their ID
app.post("/login", (req, res) => {
  let validLogin = emailLookup(req.body.email);
  if (validLogin === true) {
    res.status(403).send("EMAIL HASN'T BEEN REGISTERED!");
  }
  else if (!bcrypt.compareSync(req.body.password, users[validLogin].password)) {
    res.status(403).send("WRONG PASSWORD");
  }
  else {
    req.session.user_id = users[validLogin].id;
    res.redirect("/urls");
  }
});

//logout a user by clearing response cookies, and redirecting back to /urls
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//render the register page
app.get("/register", (req, res) => {
  let templateVars = { username: users[req.session.user_id] };
  // console.log(req.session);
  // console.log(templateVars);
  // console.log(users);
  res.render("urls_register", templateVars);
});

//render the login page
app.get("/login", (req, res) => {
  let templateVars = { username: users[req.session.user_id] };
  res.render("urls_login", templateVars);
})

//takes in data from registration form and if the email and password are valid (e.g. they exist, non-empty fields),
//it stores that data in the users object (database), and sets the cookies to the registration parameters (auto-login)
//passwords are encrypted in the database, and the session cookie is hashed
app.post("/register", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  // console.log(req);  // Log the POST request body to the console
  if (!req.body.email || !req.body.password) {
    res.status(400).send("EITHER EMAIL OR PASSWORD IS EMPTY, TRY AGAIN PLEASE!");
  }
  else if (emailLookup(req.body.email) === true) {
    const hashed = bcrypt.hashSync(req.body.password, 10);
    let newId = generateRandomString();
    users[newId] = {
      id: newId,
      email: req.body.email,
      password: hashed
    }
    req.session.user_id = newId;
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
  // console.log(req.body);  // Log the POST request body to the console
  let short = generateRandomString();
  urlDatabase[short] = { longURL: req.body.longURL, [userID]: req.session.user_id };
  res.redirect(`/urls/${short}`);
});

//upon receiving a updated submission on urls_show,
//store that new URL in a database w/ the original alphanumeric ID (old ID --> new longURL)
//redirect to `/urls/${short}`, which routes to app.get("/urls/:shortURL")
app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id || req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.redirect("/login");
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    urlDatabase[req.params.shortURL].userID = req.session.user_id;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

// POST route to remove a resource at "/urls/:shortURL/delete and redirect to /urls (app.get("/urls")"
//only allowed a logged in user, or the user to which that short URL "belongs" to, to modify or delete
//any URL in the database.  if invalid user/not logged in, redirect to /login page.
app.post("/urls/:shortURL/delete", (req, res) => {
 if (!req.session.user_id || req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.redirect("/login");
  } else {
    let short = req.params.shortURL;
    delete urlDatabase[short];
    res.redirect("/urls");
  }
});

//when URL is /urls, load the urls_index page w/ list of URL's in the database belonging to a particular
//logged in user (conditional statement is in urls_index.ejs)
app.get("/urls", (req, res) => {
  // console.log(req.session);
  let templateVars = { urls: urlDatabase,
                       username: users[req.session.user_id]
                     };
  // console.log(templateVars);
  console.log(templateVars.username);
  console.log(templateVars.urls);
  res.render("urls_index", templateVars);
});

//display Hello on "/"
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