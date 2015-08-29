var Firebase = require("firebase");
var request = require("request");
var config = require("./config");

var firebaseRef = new Firebase("https://hackthenorth.firebaseio.com/");

var parseRequestForm = {
    where: {
        updates_enabled: true
    },
    data: {
        title:' update.name',  // Android-only feature
        alert: 'update.description'
    }
};

var parseOptions = {
    uri: 'https://api.parse.com/1/push',
    method: 'POST',
    form: parseRequestForm,
    headers: {
        'X-Parse-Application-Id': PARSE_APPLICATION_ID,
        'X-Parse-REST-API-Key': PARSE_REST_API_KEY,
        'Content-Type': 'application/json',
    }
};

firebaseRef.child("/mobile/updates").on("child_added", function(snapshot) {
    var update = snapshot.val();

    request(parseOptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("REQUEST WORKED");
        }
        else {
            console.log(body);
            console.log(response.statusCode);
        }
    });

}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});
