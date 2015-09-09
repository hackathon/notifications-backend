var Firebase = require("firebase");
var request = require("request");
var config = require("./config");

var firebaseRef = new Firebase("https://hackthenorth.firebaseio.com/");

firebaseRef.authWithCustomToken(FIREBASE_AUTH_TOKEN, function(error, authData) {
    if (error) {
     console.log("Authentication Failed!", error);
    } else {
        console.log("Authentication success!");
    }
});

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

var currentTime = new Date();
// Updates Listener
firebaseRef.child("/mobile/updates").limitToLast(1).on("child_added", function(snapshot) {
    var update = snapshot.val();
    var updateTime = new Date(update.time);

    if (updateTime - currentTime < 0) {
        return;
    }
    var updateForm = {
        where: { 
            updates_enabled: true,
        }, 
        data: { 
            uri: 'hackthenorth://updates',
            title: update.name, 
            alert: update.description
        }
    };

    parseOptions['body'] = updateForm;
    request(parseOptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("UPDATE REQUEST WORKED");
        }
        else {
            console.log(body);
        }
    });

}, function (errorObject) {
  console.log("The update read failed: " + errorObject.code);
});

// Mentoring Requests Listener
firebaseRef.child("/mobile/mentoring/requests").on("child_added", function(snapshot) {
    var mentoringRequest = snapshot.val();
    var requestTime = new Date(mentoringRequest.created_time);
    var requestClaimTimestamp = mentoringRequest.claimed_time;
    if (requestClaimTimestamp != undefined && requestClaimTimestamp != '') {
        return;
    }
    if (requestTime - currentTime < 0) {
        return;
    }
    var category = mentoringRequest.category;
    var mentoringRequestForm = {
        where: { 
          mentoring_requests_enabled: true
        }, 
        data: { 
            uri: 'hackthenorth://open-requests',
            alert: 'New ' + category +' request: ' + mentoringRequest.description
        }
    };
    firebaseRef.child("/mobile/users").on("value", function(userSnapshot) {
        var allUsers = userSnapshot.val();
        for (var key in allUsers) {
            user = allUsers[key];
            
            if (user.is_mentor && user.subscriptions.indexOf(category) > -1 && user.id != undefined){
                mentoringRequestForm['where']['email_hash'] = user.id;
                parseOptions['body'] = mentoringRequestForm;
                console.log(parseOptions);
                request(parseOptions, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log("MENTORING REQUEST WORKED");
                    }
                    else {
                        console.log(body);
                    }
                });
            }
        }
    });
}, function (errorObject) {
  console.log("The mentoring request read failed: " + errorObject.code);
});

// Chat Listener
firebaseRef.child("/mobile/chats").on("child_added", function(snapshot) {
    var chatKey = snapshot.key();
    var chatForm = {
        where: { 
            chat_enabled: true
        }, 
        data: {
            uri: "hackthenorth://chat/" + chatKey
        }
    };
    var chat = snapshot.val();
    if (chat != undefined && chat['request'] != undefined && chat['request']['mentor'] != undefined) {
        var mentor_id = chat['request']['mentor']['id'];
        var hacker_id = chat['request']['hacker']['id'];
        if (mentor_id == undefined || mentor_id == '' || hacker_id == undefined || hacker_id == ''){
            return;
        }
        var userIds = [mentor_id, hacker_id];
    
        firebaseRef.child("/mobile/chats/"+chatKey+"/messages").on("child_added", function(messageSnapshot) {
            var message = messageSnapshot.val();
            if (message.timestamp == undefined) {
                return;
            }
            var messageTime = new Date(message.timestamp);
            if (messageTime - currentTime < 0) {
                return;
            }
            var senderId = message.sender;
            var text = message.text;
            for (var i in userIds) {
                var userId = userIds[i];
                if (userId != senderId) {
                    chatForm['where']['email_hash'] = userId;
                    chatForm['data']['alert'] = text;
                    parseOptions['body'] = chatForm;
                    request(parseOptions, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            console.log("CHAT NOTIFICATION WORKED");
                        }
                        else {
                            console.log(body);
                        }
                    });
                }
            }
        });
    }  
}, function (errorObject) {
  console.log("The chat read failed: " + errorObject.code);
});
