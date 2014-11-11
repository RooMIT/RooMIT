var userId = undefined;

$(document).ready(function() { 
    var mainDiv = $('#main');

    // get logged in user
    // $.get(
    //     '/user/'
    // ).done(function(response) {

    //     // user logged in
    //     if (response.user) {
    //         userId = response.user._id;
    //     } else {
            // user not logged in, show login
            mainDiv.append(Handlebars.templates['login']);
    //     }

    // }).fail(function(error) {
    //     handleError(error);
    // });

});