var Firebase = require("firebase");
var request = require("request");
var config = require("./config");

var firebaseRef = new Firebase("https://hackthenorth.firebaseio.com/");



var parseOptions = {
    uri: 'https://api.parse.com/1/push',
    method: 'POST',
    json: true,
    headers: {
        'X-Parse-Application-Id': PARSE_APPLICATION_ID,
        'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
        'Content-Type': 'application/json'
    }
};

firebaseRef.child("/mobile/updates").on("child_added", function(snapshot) {
    var update = snapshot.val();
    var parseRequestForm = {
        where: { 
            updates_enabled: true
        }, 
        data: { 
            title: update.name, 
            alert: update.description
        }
    };

    parseOptions['body'] = parseRequestForm;
    request(parseOptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("REQUEST WORKED");
        }
        else {
            console.log(body);
        }
    });

}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});
