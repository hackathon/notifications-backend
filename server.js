var Firebase = require("firebase");
var request = require("request");

var firebaseRef = new Firebase("https://hackthenorth.firebaseio.com/");
var parseRequestUrl = 'http://www.api.parse.com/1/push';

var parseOptions = {
  url: 'https://api.github.com/repos/request/request',
  headers: {
    'X-Parse-Application-Id': 'asdfsa',
    'X-Parse-REST-API-Key': 'asdfasd',
    'Content-Type': 'application/json'
  }
};


firebaseRef.child("/mobile/updates").on("child_added", function(snapshot) {
    var update = snapshot.val();
    var parseRequestForm = {
        where: {
            mentoring_requests_enabled: true
        }
        data: {
            title: update.title,  // Android-only feature
            alert: update.body
        }
    }

    request.post({url: parseRequestUrl, form: parseRequestForm, options: parseOptions}, 
        function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage.
        }
    })

}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
})