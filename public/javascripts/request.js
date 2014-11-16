// shows requests page
var showRequests = function() {
    switchActive('#requests');
    /*
    updateUser('546842ebb51420ff04b275ae', {requested: '54644e49c4a5062ab906604b'}, function(){
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
            console.log(fields);

            getSpecified(fields, function(response2){
                requestsFromUser = response2.users;

                getAll(function(response3){
                    allUsers = response3.users;
                    for (var i = 0; i < allUsers.length; i++){
                        if (allUsers[i].requested.indexOf(user._id) >= 0) {
                            requestsToUser.push(allUsers[i]);
                        }
                    }
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