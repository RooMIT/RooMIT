// shows requests page
var showRequests = function() {
    switchActive('#requests');
    /*
    updateUser('546842ebb51420ff04b275ae', {requested: '54644e49c4a5062ab906604b'}, function(){
        console.log("done");
    });  */

    var requestsToUser = [];
    var requestsFromUser = [];

    // get logged in user
    $.get(
        '/user'
    ).done(function(response) {
        var user = response.user;
        // user logged in
        if (user) { 
            //var fields = {requested: user.requested.toString()};

            getRequested(user._id, function(response2){
                requestsFromUser = response2.users;

                getAll(function(response3){
                    allUsers = response3.users;
                    for (var i = 0; i < allUsers.length; i++){
                        if (allUsers[i].requested.indexOf(user._id) >= 0) {
                            requestsToUser.push(allUsers[i]);
                        }
                    }
                    console.log("requestsToUser: ", requestsToUser);
                    console.log("requestsFromUser: ", requestsFromUser);
                    $('#content').html(Handlebars.templates['requests']({
                        requestsToUser: requestsToUser,
                        requestsFromUser: requestsFromUser
                    }));
                });
            });  
        } else {
            // user not logged in, show login
            showLogin();
        }
    }).fail(function(error) {
        handleError(error);
    });
}

// click cancel
$(document).on('click', '#cancel', function(event) {
    event.preventDefault();
    var requestedID = $(this).parent()[0].id;
    console.log(requestedID);

    // get logged in user
    $.get(
        '/user'
    ).done(function(response) {
        var user = response.user;
        // user logged in
        if (user) { 
            var newRequested = user.requested; 
            var index = newRequested.indexOf(requestedID);
            newRequested.splice(index, 1);
            var fields = {requested: newRequested.toString()};
            updateUser(user._id, fields, function(){
                console.log("updated user!", requestedID + 'removed');
                showRequests();
            });
        } else {
            // user not logged in, show login
            showLogin();
        }
    }).fail(function(error) {
        handleError(error);
    });
});

//click confirm
$(document).on('click', '#confirm', function(event) {
    event.preventDefault();
    var roommateID = $(this).parent()[0].id;

    // get logged in user
    $.get(
        '/user'
    ).done(function(response) {
        var user = response.user;
        // user logged in
        if (user) { 
            var newRoommates = user.roommates;
            newRoommates.push(roommateID);

            console.log(newRoommates.toString());
            var fields = {roommates: newRoommates.toString()};

            console.log("first fields", fields);
            updateUser(user._id, fields, function(){
                console.log("updated user!");
                getUser(roommateID, function(roommate){
                    var index = roommate.requested.indexOf(user._id);
                    var newRequested = roommate.requested;
                    newRequested.splice(index, 1);

                    var newRoommates = roommate.roommates;
                    newRoommates.push(user._id);

                    var field = {requested: newRequested.toString(), roommates: newRoommates.toString()};
                    console.log("last field ", field);
                    updateUser(roommateID, field, function(){
                        showRequests();
                    });
                });    
            });
        } else {
            // user not logged in, show login
            showLogin();
        }
    }).fail(function(error) {
        handleError(error);
    });
});

//click deny
$(document).on('click', '#deny', function(event) {
    event.preventDefault();
    var deniedID = $(this).parent()[0].id;

    // get logged in user
    $.get(
        '/user'
    ).done(function(response) {
        var user = response.user;
        // user logged in
        if (user) { 
            getUser(deniedID, function(denied){
                var index = denied.requested.indexOf(user._id);
                var newRequested = denied.requested;
                newRequested.splice(index, 1);

                var field = {requested: newRequested.toString()};
                updateUser(deniedID, field, function(){
                    showRequests();
                });
            });    
        } else {
            // user not logged in, show login
            showLogin();
        }
    }).fail(function(error) {
        handleError(error);
    });
});
