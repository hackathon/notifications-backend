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

// Updates Listener
firebaseRef.child("/mobile/updates").limitToLast(1).on("child_added", function(snapshot) {
    var update = snapshot.val();
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
    var category = mentoringRequest.category
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
        var user_ids = [mentor_id, hacker_id];
    
        firebaseRef.child("/mobile/chats/"+chatKey+"/messages").on("child_added", function(messageSnapshot) {
            var message = messageSnapshot.val();
            var sender_id = message.sender;
            var text = message.text;
            for (var i in user_ids) {
                user_id = user_ids[i];
                if (user_id != sender_id) {
                    chatForm['where']['email_hash'] = user_id;
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
