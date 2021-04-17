const puppeteer = require('puppeteer');
const cheerio = require("cheerio")
const nodemailer = require("nodemailer")
const wbm = require('wbm');
const CronJob = require('cron').CronJob;
require('dotenv').config();



const url = "https://www.amazon.in/Bundled-Spider-Man-GTaSport-Ratchet-3Month/dp/B08FNXXH5J/" // Url of the Product page//

async function setupBrowser(){
const browserInstance = await puppeteer.launch({headless : false, defaultViewport: null,
    args: ["--start-maximized",]})
    const page = await browserInstance.newPage();
    await page.goto(url);
    return page;

}

async function getPrice(page){

    await page.reload();
    let html = await page.evaluate(()=>document.body.innerHTML)
    cheerio("#productTitle" , html).each(function(){
    let productTitle = cheerio(this).text()
    //console.log(productTitle)
    cheerio('#priceblock_ourprice' , html).each(function(){
    let productPriceRs = cheerio(this).text();
        
    // console.log(productPriceRs);         // This Price will come with a Rupees(Rs) sign//
    let productPriceNo = Number(productPriceRs.replace(/[^0-9.-]+/g,""));  // regular Expression to remove Rs sign//
     // console.log(productPriceNo)          // price after removing Rs sign//

        if(productPriceNo < 30000){
            //console.log("Get it ASAP! Price Dropped for "+productTitle+" "+ productPriceRs)
            ;
            sendNotification(productPriceRs , productTitle);
            
        }
    })
    })
  


    
}

async function startTracking() {
    const page = await setupBrowser();
  
    let job = new CronJob('*/50 * * * * *', function() { //runs every 15 seconds in this config
      getPrice(page)
    }, null, true, null, null, true);
    job.start();
}


async function sendNotification(productPriceRs, productTitle , cb) {

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    });
  
    
    
    let htmlText = "Grab it from Here "+ `<a href=\"${url}\">Link</a>`;
  
    let info = await transporter.sendMail({
      from: '"Price Tracker" <iammrinalkc@gmail.com>',
      to: "mrinalb1223@gmail.com",
      subject: 'The Price for the'+productTitle+''+'has been dropped to'+productPriceRs, 
      html: htmlText
    });
  
    console.log("Message sent: %s", info.messageId);
    
  }

//WhatsApp Notification Function runs very inconsistenty that's why its commented out 


  /*async function sendWhatsappNotification(url , productPriceRs , productTitle){
wbm.start().then(async () => {
    const phones = ['919993169393'];
    const message =`the price for the
    ${productTitle} has come down to ${productPriceRs} 
    get it here ${url}`;


    await wbm.send(phones, message);
    await wbm.end();
}).catch(err => console.log(err));

}*/ 


//There are some bugs with library wbm it sends messages very inconsitently will look to a better soln for it 








startTracking();