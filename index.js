
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');


main().catch(err => console.log(err));

// mongoose mongodb connection
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
}

let urlSchema = new mongoose.Schema({
  web: String,
  uniqueId: Number,
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

app.get('/api/shorturl/:id', (req, res) => {

  let input = req.params.id;

  if (input === 'undefined') {
    res.json({ error: 'invalid url' });
    return
  }

  Url.findOne({ uniqueId: input }, (error, result) => {
    if (!error && result != undefined) {
      res.redirect(result.web);
    } else {
      res.json({ error: 'Url not found' });
    }
  });
  return;
});


app.post('/api/shorturl', async (req, res) => {
  var numOfRecords = (await Url.count({})) + 1;

  let inputUrl = req.body.url;

  let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);
  if (!inputUrl.match(urlRegex)) {
    res.json({ error: 'Invalid URL' });
    return;
  }

  //if input is undefined return error
  if (inputUrl === 'undefined') {
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

      // new mongo model
      let url = new Url({
        web: req.body.url,
        uniqueId: numOfRecords
      });

      //save the model
      url.save(function(err, data) {
        //if error
        if (err) {
          res.json({ error: 'invalid url' });
          return;
        }
        //return to the request client
        res.json({ original_url: req.body.url, short_url: numOfRecords, link: 'https://boilerplate-project-urlshortener-.ioguns.repl.co/api/shorturl/' + numOfRecords });
      });
    }
  });

});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
