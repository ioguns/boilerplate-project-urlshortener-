//https://mongoosejs.com/docs/
//https://cloud.mongodb.com/
//https://www.freecodecamp.org/learn/back-end-development-and-apis/back-end-development-and-apis-projects/url-shortener-microservice

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
var crypto = require('crypto');


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
}

let urlSchema = new mongoose.Schema({
  web: String,
  hash: String,
})

let Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:url', (req, res) => {
  res.redirect(listOfUrl[req.params.url]);
});

app.post('/api/shorturl', (req, res) => {
  const myURL = new URL(req.body.url);
  //do a dns lookup to validate the posted url
  dns.lookup(myURL.hostname, (err, address) => {
    //if error validating 
    if (err) {
      res.json({ error: 'invalid url' });
      return;
    }

    const query = Url.where({ web: req.body.url });

    query.findOne(function(err, foundUrl) {
      //if error occured
      if (err) return console.log(err);
      if (foundUrl) {
        //otherwise notify the client that the url has already been shortened
        res.json({ error: 'The URL is already shortened.' });
      } else {
        //if not found then create a new entry

        //get the hash of the url
        let hash = crypto.createHash("sha256").update(address, "binary").digest("base64");

        // new mongo model
        let url = new Url({
          web: req.body.url,
          hash: hash
        });

        //save the model
        url.save(function(err, data) {
          //if error
          if (err) {
            res.json({ error: 'invalid url' });
            return;
          }
          //return to the request client
          res.json({ original_url: req.body.url, short_url: hash });
        });
      }
    });

  });
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
