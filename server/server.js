require("dotenv").config()
const express = require('express')  // This line imports the Express module, which allows us to create a web server in JavaScript
const app = express()
const cookieParser = require('cookie-parser')
// We create an instance of the Express application by calling the express() function. 
// This app object represents our web server.


const cors = require('cors')
const items = require('./items.json')  //We import "items.json" file that contains an array of items.
const stripe = require('stripe')('sk_test_v0rQRqenSs7uso5uewLvjI7b00A9HmbCmN');
const { v4: uuidV4 } = require("uuid")
const { sendDownloadLink, sendAllDownloadLinks } = require("./mailer")
const { linkContactAndItem, getContactPurchasedItems } = require('./contacts');

const downloadLinkMap = new Map()
const DOWNLOAD_LINK_EXPIRATION = 10 * 60 * 1000 // 10 minutes
const COOKIE_EXPIRATION = 30 * 24 * 60 * 60 * 1000 // 30 Days

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:1234');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
  
app.use(cookieParser())
app.use(express.json())
app.use(express.static('pictures'));

app.use(
    cors({
        origin: process.env.CLIENT_URL,
    })
)

app.get('/items', async (req, res) => {  // We define a route for handling HTTP GET requests
    const email = req.cookies.email
    const purchasedItemIds = (await getContactPurchasedItems(email)).map(item => item.id)
    const itemsWithImages = items.map(item => {
        const { id, name, priceInCents, img, author, description } = item;
        const purchased = purchasedItemIds.includes(id);
        const imageUrl = img ? `${img}` : '';


    
        return {
          id,
          name,
          price: priceInCents / 100,
          purchased,
          imageUrl,
          author,
          description
        };
      });
    
      res.json(itemsWithImages);
    
})

app.post('/download-email', (req, res) => {
    const email = req.cookies.email
    const itemId = req.body.itemId
    const code = createDownloadCode(itemId)
    sendDownloadLink(email, code, items.find(i => i.id ===
        parseInt(itemId))).then(() => {
            res.json({ message: "Check your email" })
        })
        .catch(() => {
            res.status(500).json({ message: "Error: Please try again" })
        })
})

app.post('/download-all', async (req, res) => {
    const email = req.body.email
    const items = await getContactPurchasedItems(email)
    setEmailCookie(res, email)
    sendAllDownloadLinks(email, items.map(item => {
        return { item, code: createDownloadCode(item.id) }
    }))
    return res.json({ message: "Check your email for a download link" })
})

app.post("/create-checkout-session", async (req, res) => {
    const item = items.find(i => i.id === parseInt(req.body.itemId))
    if (item == null) {
        return res.status(400).json({ message: "Invalid Item" })
    }
    const session = await createCheckoutSession(item)
    res.json({ id: session.id });
});

app.get('/download/:code', (req, res) => {
    const itemId = downloadLinkMap.get(req.params.code) // retrieves the corresponding item ID from the downloadLinkMap using 
    if (itemId == null) {                               // the route parameter code as the key.
        return res.send("This link has either expired or is invalid")
    }

    const item = items.find(i => i.id === itemId)
    if (item == null) {
        return res.send("This item could not be found")
    }

    downloadLinkMap.delete(req.params.code)
    res.download(`downloads/${item.file}`)
})

app.get('/purchase-success', async (req, res) => {
    const item = items.find(i => i.id === parseInt(req.query.itemId))
    const { customer_details: { email } } = await stripe.checkout.sessions.retrieve(req.query.sessionId)

    setEmailCookie(res, email)
    linkContactAndItem(email, item)
    const downloadLinkCode = createDownloadCode(item.id)
    console.log(downloadLinkCode)
    sendDownloadLink(email, downloadLinkCode, item)
    res.redirect(`${process.env.CLIENT_URL}/download-links.html`)
})

function setEmailCookie(res, email) {
    res.cookie("email", email, {
        httpOnly: true,
        secure: true,
        maxAge: COOKIE_EXPIRATION
    })
}

function createCheckoutSession(item) {
    return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.priceInCents,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.SERVER_URL}/purchase-success?itemId=${item.id}&sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.CLIENT_URL,
    });
}

function createDownloadCode(itemId) {
    const downloadUuid = uuidV4()
    downloadLinkMap.set(downloadUuid, itemId)
    setTimeout(() => {
        downloadLinkMap.delete(downloadUuid)
    }, DOWNLOAD_LINK_EXPIRATION)
    return downloadUuid
}

app.listen(3000)