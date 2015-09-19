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

var times = {"update": new Date(), "mentoring": new Date(), "chat": new Date()};
var parseFirstName = function(name) {
    splitName = name.split(" ");
    if (splitName.length == 1) {
        return name;
    }
    return splitName.slice(0, splitName.length - 1).join(" ");
}

// Updates Listener
firebaseRef.child("/mobile/updates").limitToLast(1).on("child_added", function(snapshot) {
    var update = snapshot.val();
    var updateTime = new Date(update.time);

    if (updateTime - times['update'] <= 0) {
        return;
    }
    if (update.name == undefined || update.name.length == 0) {
        return;
    }
    times['update'] = updateTime;
    var updateForm = {
        where: { 
            updates_enabled: true,
        }, 
        data: { 
            uri: 'hackthenorth://updates',
            title: 'New Update', 
            alert: update.name
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
    if (requestTime - times['mentoring'] <= 0) {
        return;
    }
    var category = mentoringRequest.category;
    var hackerId = mentoringRequest.hacker.id;
    var description = mentoringRequest.description;
    if (category == undefined || hackerId == undefined || description == undefined) {
        return;
    }
    category = category.replace(category[0], category[0].toUpperCase());
    times['mentoring'] = requestTime;
    var alertMessage = category + ': ' + description;
    var mentoringRequestForm = {
        where: { 
          mentoring_requests_enabled: true
        }, 
        data: { 
            uri: 'hackthenorth://open-requests',
            title: 'New Request',
            alert: alertMessage
        }
    };
    firebaseRef.child("/mobile/users").once("value", function(userSnapshot) {
        var allUsers = userSnapshot.val();
        for (var key in allUsers) {
            user = allUsers[key];
            if (user.is_mentor && user.subscriptions != undefined && 
                user.id != undefined && user.id !== hackerId &&
                (mentoringRequest.category == 'other' || 
                    user.subscriptions.indexOf(mentoringRequest.category) > -1)){
                mentoringRequestForm['where']['email_hash'] = user.id;
                parseOptions['body'] = mentoringRequestForm;
                console.log(mentoringRequestForm);
                console.log(requestTime);
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
            uri: "hackthenorth://chat/" + chatKey,
            title: 'New Message'
        }
    };
    var chat = snapshot.val();
    if (chat != undefined && chat['request'] != undefined && chat['request']['mentor'] != undefined) {
        var mentorId = chat['request']['mentor']['id'];
        var hackerId = chat['request']['hacker']['id'];
        var mentorName = chat['request']['mentor']['name'];
        var hackerName = chat['request']['hacker']['name'];
        if (mentorId == undefined || mentorId == '' || hackerId == undefined || hackerId == ''){
            return;
        }
        var userIds = [mentorId, hackerId];
        var userNames = [parseFirstName(mentorName), parseFirstName(hackerName)];
    
        firebaseRef.child("/mobile/chats/"+chatKey+"/messages").on("child_added", function(messageSnapshot) {
            var message = messageSnapshot.val();
            if (message.timestamp == undefined) {
                return;
            }
            var messageTime = new Date(message.timestamp);
            if (messageTime - times['chat'] <= 0) {
                return;
            }
            times['chat'] = messageTime;
            var senderId = message.sender;
            var text = message.text;
            for (var i in userIds) {
                var userId = userIds[i];
                if (userId != senderId) {
                    chatForm['where']['email_hash'] = userId;
                    chatForm['data']['alert'] = userNames[1 - i] + ': ' + text;
                    parseOptions['body'] = chatForm;
                    request(parseOptions, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            console.log(senderId);
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
