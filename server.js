require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');

const PORT = process.env.PORT || '8080';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/build'));
app.use(cors({ optionsSuccessStatus: 200 }));

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const { Schema } = mongoose;

const ShortUrlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, default: 0 },
});

const ShortUrl = mongoose.model('shorturl', ShortUrlSchema);

const REPLACE_REGEX = /^https?:\/\//i;
const createAndSaveUrl = (req, res) => {
  const urlWithoutHttp = req.body.url.replace(REPLACE_REGEX, '');

  dns.lookup(urlWithoutHttp, (err) => {
    if (err) {
      res.json({ error: 'invalid url' });
    } else {
      ShortUrl.estimatedDocumentCount().exec((err, count) => {
        const newShortUrl = new ShortUrl({
          original_url: req.body.url,
          short_url: count + 1,
        });

        newShortUrl.save((err, newUrl) => {
          if (err) return res.send(err);
          return res.json({ original_url: newUrl.original_url, short_url: newUrl.short_url });
        });
      });
    }
  });
};

const removeAllPersons = (req, res) => {
  ShortUrl.deleteMany({}, (err, allRemoved) => {
    if (err) return res.send(err);
    return res.json(allRemoved);
  });
};

const showAllUrls = (req, res) => {
  ShortUrl.estimatedDocumentCount().exec((err, count) => {
    if (err) return res.send(err);
    return res.json({ count: count });
  });
};

const redirectToFullUrl = (req, res) => {
  ShortUrl.findOne({ short_url: req.params.shorturl }).exec((err, url) => {
    if (err) return res.send(err);
    res.redirect(url.original_url);
  });
};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/build/index.html');
});

app.post('/api/shorturl/new', createAndSaveUrl);
app.get('/api/remove', removeAllPersons);
app.get('/api/all', showAllUrls);
app.get('/api/shorturl/:shorturl', redirectToFullUrl);

// listen for requests :)
var listener = app.listen(PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
