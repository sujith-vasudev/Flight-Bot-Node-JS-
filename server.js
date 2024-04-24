var express = require("express");
var FBBotFramework = require("fb-bot-framework");
var http = require('http');
var https = require('https');
const fileSystem = require('fs');

require('dotenv').config();


var app = express(); // create an express framework called app
// Create a Bot using FB Page Token and Verify Token
var bot = new FBBotFramework({
    page_token: "<sometoken>",
    verify_token: "sujithv"
});



const ticketConfirmRegex = "flights from (`.*?`) to (`.*?`) on `(\d{4}-\d{2}-\d{2})` and you opted (`Business`|`Economic`) class for (\d{1,4}) Adults\s?(?:and (\d{0,4}) children|)"
const reply = "I am constantly being improved to help you with more accurate answers. I need help in understanding your query. ";


let jsonflightinfo; // Holds the parsed value of JSON table
let startingairport, arrivingairport, stationCard, responseText;
let msg;
let matc;
let know;


function loadMasterDataFromCDN(CDN_URL){
    console.log(`Loading master data from CDN ${CDN_URL}`)
    //Following code reads Train table JSON file from the server and parses
    https.get(CDN_URL, (resp) => {
        var jsondata = '';
    
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
        jsondata += chunk;
        });
    
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            console.log(`Sucessfully fetched data from ${CDN_URL}`)
            return JSON.parse(jsondata)
        });
    
    }).on("error", (error) => {
        console.log(`Failed to  fetched data from ${CDN_URL} Error: ${error.message}`)
    });
}


jsonflightinfo = loadMasterDataFromCDN(process.env.FLIGHT_CDN_URL)
know = loadMasterDataFromCDN(process.env.BASIC_QUERIES_CDN)


// Define the video clip carousel of 3 clips for the chatbot
// It consists of a Title, Image URL, a Button with URL and Title

/*
{
    "title": "Cochin",
    "image_url": "https://aeropolis.s3.amazonaws.com/BotDemo/Sujith/cochincopy.jpg",
    "buttons": [
        {
            "type": "postback",
            "title": "Cochin",
            "payload": "Cochin"
        }
    ]
}
*/ 
let airportList = loadMasterDataFromCDN(process.env.CAROUSEL_CLIPS_CDN)




// fileSystem.readFile('flights.json', 'utf8', function (err, data) {
//     if (err) { console.log("Error in accesing file"); }
//     jsonflightinfo = JSON.parse(data);
// });


var services = [

    {
        "title": "FAQ",
        "subtitle": "Choose your Relevant Query",
        "buttons": [
            {
                "type": "postback",
                "title": "Flight reschedule",
                "payload": "reshedule"
            },
            {
                "type": "postback",
                "title": "Flight Cancellation",
                "payload": "cancellation"
            },
            {
                "type": "postback",
                "title": "Delay/cancellation",
                "payload": "delay"
            }

        ]
    },
    {
        "title": "Flight Services",
        "subtitle": "Choose your query regarding Services :",
        "buttons": [
            {
                "type": "postback",
                "title": "CHARTER SERVICES",
                "payload": "charter"
            },
            {
                "type": "postback",
                "title": "BUSSINESS CLASS CHARTER SRVICES",
                "payload": "bccs"
            },
            {
                "type": "postback",
                "title": "CARGO SERVICES",
                "payload": "cargo_services"
            }

        ]
    }
    ,
    {
        "title": "General",
        "subtitle": "General",
        "buttons": [
            {
                "type": "postback",
                "title": "refunds",
                "payload": "refunds"
            },
            {
                "type": "postback",
                "title": "infants",
                "payload": "infants"
            },
            {
                "type": "postback",
                "title": "priority baggage",
                "payload": "pb"
            }

        ]
    }



];






startingairport = "";
arrivingairport = "";
var mn = 0;

// Setup Express middleware for /webhook
app.use('/webhook', bot.middleware());

// Setup listener for incoming messages


bot.on('message', function (userId, message) {
    // check if the message is a matching the Regx
    matc = 0;
    console.log(message);

    msg = message;//viewing what is user asking to chatbot
    console.log("Message", message);

    //Regx block
    var reg1 = /good morning/g;
    var reg2 = /good evening/g;
    var reg3 = /good afternoon/g;
    var reg4 = /to go/g;
    var reg5 = /to flights/g;
    var reg6 = /flight details/g;
    var reg7 = /flights/g;
    var reg8 = /flight/g;
    var reg9 = /to/g;
    var acdetails;
    if ((msg.toLowerCase() == "hii") || (msg.toLowerCase() == "hi") || (msg.toLowerCase() == "hello")) {
        matc += 1;
        bot.getUserProfile(userId, function (err, profile) {
            if (err) { console.log("err"); }

            bot.sendTextMessage(userId, "Hello.. " + profile.first_name);
            bot.sendTextMessage(userId, "\n How may i Help you!.. ");

        });
    }


    if (reg1.test(message.toLowerCase()) || reg2.test(message.toLowerCase()) || reg3.test(message.toLowerCase())) {
        matc += 1;
        var day = new Date();
        var hr = day.getHours();
        if (hr >= 0 && hr < 12) {

            bot.sendTextMessage(userId, "Good Morning!");


        } else if (hr == 12) {
            bot.sendTextMessage(userId, "Good Noon!");
        } else if (hr >= 12 && hr <= 16) {
            bot.sendTextMessage(userId, "Good Afternoon!");

        }
        else if (hr >= 17 && hr <= 19) {
            bot.sendTextMessage(userId, "Good Evening!");
        }
        else {
            bot.sendTextMessage(userId, "Good night!");
        }
    };


    if (msg in know) {
        matc += 1;
        bot.sendTextMessage(userId, know[msg]);
    }


    if (reg4.test(message.toLowerCase()) || reg5.test(message.toLowerCase()) || reg6.test(message.toLowerCase()) || (reg9.test(message.toLowerCase()) && reg7.test(message.toLowerCase()) || reg8.test(message.toLowerCase()))) {
        stationCard = "start";
        matc += 1;
        bot.sendTextMessage(userId, "Select Starting Airport...")

        bot.sendGenericMessage(userId, airportList);

    };

    if (matc == 0) {

        bot.sendTextMessage(userId, reply);
        bot.sendGenericMessage(userId, services);
        bot.on('postback', function (userId, payload) {
            console.log(payload);
            if (payload in know) {
                bot.sendTextMessage(userId, know[payload]);
            }
        });
    }
});

bot.on('postback', function (userId, payload) {
    if (stationCard == "start") {
        startingairport = payload;
        bot.sendTextMessage(userId, "Select Destination Airport....")
        bot.sendGenericMessage(userId, airportList);

        stationCard = "end";
    } else if (stationCard == "end") {
        arrivingairport = payload;
        console.log("Payload", payload);

        stationCard = "";
        if (startingairport != arrivingairport) {

            matc, mn = 0;
            // Look up for the train details matching starting and arriving stations
            for (var i = 0; i < jsonflightinfo.flights.length; i++) {

                if ((jsonflightinfo.flights[i].From == startingairport)
                    && (jsonflightinfo.flights[i].To == arrivingairport)) {
                    // Found a match, get the details from the JSON table and display	
                    responseText = " Here's your Flight information:\n\n";
                    responseText += " Your Flight Number :" + jsonflightinfo.flights[i].Flight_no + " \n\n";
                    responseText += ("Your Airline is : " + jsonflightinfo.flights[i].Airline + "\n\n Class :" + jsonflightinfo.flights[i].class + "");
                    responseText += ("\n\nArrival : " + jsonflightinfo.flights[i].From + " at \t " + jsonflightinfo.flights[i].Arrival);
                    responseText += ("\n\nDeparture " + jsonflightinfo.flights[i].To + " at " + jsonflightinfo.flights[i].Departure);
                    responseText += ("\n\nIntermediate stop :\t " + jsonflightinfo.flights[i].Intermediate_stop);
                    responseText += ("\n\nFlight Charge :\t " + jsonflightinfo.flights[i].Fare);
                    responseText += "\n\nYour Ticket Is Here (QR Code)";
                    responseText += "\nThank You!!!\nHappy Journey!!!";
                    bot.sendTextMessage(userId, responseText);

                    mn += 1;
                }
                if ((jsonflightinfo.flights[i].From == startingairport) && (jsonflightinfo.flights[i].Intermediate_stop == arrivingairport)) {

                    responseText = " 1Here's your Flight information:\n\n";
                    responseText += " Your Flight Number :" + jsonflightinfo.flights[i].Flight_no + " \n\n";
                    responseText += ("Your Airline is : " + jsonflightinfo.flights[i].Airline + "\n\n Class :" + jsonflightinfo.flights[i].class + "");
                    responseText += ("\n\nArrival : " + jsonflightinfo.flights[i].From + " at \t " + jsonflightinfo.flights[i].Arrival);
                    responseText += ("\n\nDeparture " + jsonflightinfo.flights[i].Intermediate_stop + " at " + jsonflightinfo.flights[i].Intermediate_stop_arrival);

                    responseText += ("\n\nFlight Charge :\t " + jsonflightinfo.flights[i].Source_interstation_price);
                    responseText += "\n\nYour Ticket Is Here (QR Code)";
                    responseText += "\nThank You!!!\nHappy Journey!!!";
                    bot.sendTextMessage(userId, responseText);

                    mn += 1;
                }
                if ((jsonflightinfo.flights[i].Intermediate_stop == startingairport) && (jsonflightinfo.flights[i].To == arrivingairport)) {


                    responseText = " 2Here's your Flight information:\n\n";
                    responseText += " Your Flight Number :" + jsonflightinfo.flights[i].Flight_no + " \n\n";
                    responseText += ("Your Airline is : " + jsonflightinfo.flights[i].Airline + "\n\n Class :" + jsonflightinfo.flights[i].class + "");
                    responseText += ("\n\nArrival : " + jsonflightinfo.flights[i].Intermediate_stop + " at \t " + jsonflightinfo.flights[i].Intermediate_stop_arrival);
                    responseText += ("\n\nDeparture " + jsonflightinfo.flights[i].To + " at " + jsonflightinfo.flights[i].Departure);

                    responseText += ("\n\nFlight Charge :\t " + jsonflightinfo.flights[i].Intermediate_Destination_price);
                    responseText += "\n\nYour Ticket Is Here (QR Code)";
                    responseText += "\nThank You!!!\nHappy Journey!!!";
                    bot.sendTextMessage(userId, responseText);

                    mn += 1;
                }
            }
            if (mn == 0) {

                bot.sendTextMessage(userId, "Sorry Service is unavialable from\t" + startingairport + "To \t" + arrivingairport + "\n\n\n\n\n The International Services are available to Only the Respective Country International Airports!!!!");
            }

        } else {
            bot.sendTextMessage(userId, "Starting and Arriving Are the Same!!!");
        }

    }

});

//Make Express listening
app.listen(3001);

// For testing purposes, let us display a message on the terminal or console
console.log("Aeropolis Is Running...");