// shows requests page
var showRequests = function() {
    switchActive('#requests');
    /*
    updateUser('54644e49c4a5062ab906604b', {requested: '5467fae80ca084bf02172415'}, function(){
        console.log("done");
    }); */

    var requestsToUser = [];
    var requestsFromUser = [];

    // get logged in user
    $.get(
        '/user'
    ).done(function(response) {
        var user = response.user;
        // user logged in
        if (user) { 
            var fields = {requested: user.requested.toString()};

            getSpecified(fields, function(response2){
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
                console.log("updated user!");
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
            updateUser(user._id, fields, function(){
                console.log("updated user!");
                /*getUser(roommateID, function(roommate){
                    var index = roommate.requested.indexOf(user._id);
                    var newRequested = roommate.requested;
                    newRequested.splice(index, 1);

                    var newRoomates = roommate.roommates;
                    newRoommates.push(user._id);

                    var field = {requested: newRequested.toString(), roommates: newRoommates.toString()};
                    updateUser(roommateID, field, function(){
                        showRequests();
                    });
                });*/
            });
        } else {
            // user not logged in, show login
            showLogin();
        }
    }).fail(function(error) {
        handleError(error);
    });
});
