// click requests
$(document).on('click', '#requests:not(.active) a', function(event) {
    showRequests();
});

// click cancel
$(document).on('click', '.cancel', function(event) {
    event.preventDefault();
    var requestedID = $(this).attr('value');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    getUser(user_id, function(user){
        var newRequested = user.requested; 
        var index = newRequested.indexOf(requestedID);
        newRequested.splice(index, 1);
        var fields = {requested: JSON.stringify(newRequested)};
        updateUser(user._id, fields, function(){
            console.log("updated user!", requestedID + 'removed');
            showRequests();
        });
    });
});

//click confirm
$(document).on('click', '.confirm', function(event) {
    event.preventDefault();
    var roommateID = $(this).attr('value');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
   
    getUser(user_id, function(user){
        var newRoommates = user.roommates;
        newRoommates.push(roommateID);

        var fields = {roommates: JSON.stringify(newRoommates)};

        updateUser(user._id, fields, function() {
            getUser(roommateID, function(roommate){
                var index = roommate.requested.indexOf(user._id);
                var newRequested = roommate.requested;
                newRequested.splice(index, 1);

                var newRoommates = roommate.roommates;
                newRoommates.push(user._id);

                var field = {requested: JSON.stringify(newRequested), roommates: JSON.stringify(newRoommates)};
                updateUser(roommateID, field, function(){
                    showRequests();
                });
            });    
        });
    });
});

//click deny
$(document).on('click', '.deny', function(event) {
    event.preventDefault();
    var deniedID = $(this).attr('value');

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();
    
    getUser(deniedID, function(denied){
        var index = denied.requested.indexOf(user_id);
        var newRequested = denied.requested;
        newRequested.splice(index, 1);

        var field = {requested: JSON.stringify(newRequested)};
        updateUser(deniedID, field, function(){
            showRequests();
        });
    });
});

// refetch all requests to/from user and display them
var showRequests = function() {
    switchActive('#requests');

    var requestsToUser = [];
    var requestsFromUser = [];

    // get logged in user
    var user_id = $.cookie('user');
    if (!user_id) return showLogin();

    getRequested(user_id, function(res){
        requestsFromUser = res.users;

        getAll(function(res2){
            allUsers = res2.users;
            for (var i = 0; i < allUsers.length; i++){
                if (allUsers[i].requested.indexOf(user_id) >= 0) {
                    requestsToUser.push(allUsers[i]);
                }
            }
            console.log('requestsToUser: ', requestsToUser, ' requestsFromUser: ', requestsFromUser);

            $('#content').html(Handlebars.templates['requests']({
                requestsToUser: requestsToUser,
                requestsFromUser: requestsFromUser
            }));
        });
    });
}
