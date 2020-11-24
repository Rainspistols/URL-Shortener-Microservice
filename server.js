require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');

app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const { Schema } = mongoose;

const ShortUrlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, default: 0 },
});

const ShortUrl = mongoose.model('shorturl', ShortUrlSchema);

app.use(cors());

const createAndSaveUrl = (req, res) => {
  ShortUrl.estimatedDocumentCount().exec((err, count) => {
    const newShortUrl = new ShortUrl({
      original_url: req.body.original_url,
      short_url: count + 1,
    });

    newShortUrl.save((err, newUrl) => {
      if (err) return res.send(err);
      return res
        .status(200)
        .json({ original_url: newUrl.original_url, short_url: newUrl.short_url });
    });
  });
};

const removeAllPersons = (req, res) => {
  ShortUrl.deleteMany({}, (err, allRemoved) => {
    if (err) return res.send(err);
    return res.status(200).json(allRemoved);
  });
};

const showAllUrls = (req, res) => {
  ShortUrl.estimatedDocumentCount().exec((err, count) => {
    if (err) return res.send(err);
    return res.status(200).json({ count: count });
  });
};

const redirectToFullUrl = (req, res) => {
  ShortUrl.findOne({ short_url: req.params.shorturl }).exec((err, url) => {
    if (err) return res.send(err);

    if (validUrl.isUri(url.original_url)) {
      res.redirect(url.original_url);
    } else {
      res.json({ error: 'invalid url' });
    }
  });
};

app.post('/api/shorturl/new', createAndSaveUrl);
app.get('/api/remove', removeAllPersons);
app.get('/api/all', showAllUrls);
app.get('/api/shorturl/:shorturl', redirectToFullUrl);

app.listen(process.env.PORT, function () {
  console.log(`Listening on port ${process.env.PORT}`);
});
