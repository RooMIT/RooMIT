$(document).ready(function() { 

    // get logged in user
    $.get(
        '/user'
    ).done(function(response) {
        var user = response.user;
        clearMainDiv();

        // user logged in
        if (user) {
            showUserProfile(user, user);
        } else {
            // user not logged in, show login
            $('#main').append(Handlebars.templates['login']);
            attachValidators();
        }

    }).fail(function(error) {
        handleError(error);
    });

});