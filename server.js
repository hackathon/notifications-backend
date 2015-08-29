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
    var updateForm = {
        where: { 
            updates_enabled: true
        }, 
        data: { 
            title: update.name, 
            alert: update.description
        }
    };

    parseOptions['body'] = updateForm;
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

firebaseRef.child("/mobile/mentoring/requests").on("child_added", function(snapshot) {
    var mentoringRequest = snapshot.val();
    var mentoringRequestForm = {
        where: { 
            mentoring_requests_enabled: true
        }, 
        data: { 
            alert: mentoringRequest['hacker'].name + " needs a mentor!"
        }
    };

    parseOptions['body'] = mentoringRequestForm;
    request(parseOptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("MENTORING REQUEST WORKED");
        }
        else {
            console.log(body);
        }
    });

}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});
