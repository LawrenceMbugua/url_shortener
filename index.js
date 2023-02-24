const express = require('express')
const cors = require('cors')
let bodyParser = require('body-parser')
const mongoose = require('mongoose')
const app = express()

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html')
})


const uri = 'mongodb+srv://lawrence:X7GZAqqdMP9JABdK@cluster0.3ab4l.mongodb.net/?retryWrites=true&w=majority'

mongoose.connect(uri , { useNewUrlParser: true, useUnifiedTopology: true }, () => {
    console.log('Connected to the Database!');
})


app.listen(3000, (req, res) => {
    console.log("Listening on port 3000...");
})


// Schema

const urlSchema = new mongoose.Schema({
    original_url: {
        type: String,
        required: true
    },
    short_url : {
        type: Number,
        required: true
    }
});

// Model
const Urls = mongoose.model("Urls", urlSchema)

//Get Request
app.get('/api/shorturl/:short_url', (req, res) => {
    let short_url = req.params.short_url;

    Urls.findOne({short_url: short_url}, (error, result) => {
        if (!error && result != undefined) {
            res.redirect(result['original_url'])
        } else {
            res.json('URL not found')
        }
    })
})




// Post request
let responseObject = {}
app.post("/api/shorturl", (req, res) => {
    let inputUrl = req.body.inputUrl;

    let urlRegex = new RegExp("((http|https)://)(www.)?"
    + "[a-zA-Z0-9@:%._\\+~#?&//=]"
    + "{2,256}\\.[a-z]"
    + "{2,6}\\b([-a-zA-Z0-9@:%"
    + "._\\+~#?&//=]*)")

    if (!inputUrl.match(urlRegex)) {
        res.json({error: "Invalid URL"})
        return
    }
    
    responseObject['original_url'] = inputUrl

    let short_url = 1

    Urls.findOne({})
        .sort({short_url: 'desc'})
        .exec( (error, result) => {

            // Update short_url if there's something in the Database
            if (!error && result != undefined) {
                short_url = result['short_url'] + 1
            }

            if (!error) {
                Urls.findOneAndUpdate(
                    {original_url: inputUrl},
                    {original_url: inputUrl, short_url: short_url},
                    {new: true, upsert: true},
                    (error, savedUrl) => {
                        if (!error) {
                            responseObject['short_url'] = savedUrl['short_url']
                            res.json(responseObject)
                        }
                    }
                )
            }
        })


})

