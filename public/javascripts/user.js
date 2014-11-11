// replace the login form with the register form
$(document).on('click', '#toggle-register', function(event) {
    var loginDiv = $('#login-form');
    loginDiv.replaceWith(Handlebars.templates['register']);
});

// replace the register form with the login form
$(document).on('click', '#toggle-login', function(event) {
    var registerDiv = $('#register-form');
    registerDiv.replaceWith(Handlebars.templates['login']);
});