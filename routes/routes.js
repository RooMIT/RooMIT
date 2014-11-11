var UserController = require('./userController');
var PreferenceController = require('./preferenceController');

module.exports = function(app) {

    app.get('/', function(req, res) {
        res.render('index');
    });

    /* 
        Logs in the user, creates session

        POST /login
        Request Body: empty
        Response:
            - error: error if there was one
    */
    app.post('/login', function(req, res) {
        UserController.login(req, res);
    });

    /*  
        Logs out the user, destroys session

        POST /logout
        Request Body: empty
        Response:
            - error: error if there was one
    */
    app.post('/logout', function(req, res) {
        UserController.logout(req, res);
    });


    /*  
        Creates a user, logs them in, and creates a session.
        Also creates all their preferences.

        POST /users
        Request Body:
        	- name: name of the new user
        	- email: unique MIT email
        	- password: password
        Response:
            - error: error if there was one
    */
    app.post('/users', function(req, res) {
        UserController.create(req, res);
    });

    /*  
        Get the logged in user

        GET /user
        Request Body: empty
        Response:
            - user: the user
            - error: error if there was one
    */
    app.get('/user', function(req, res) {
        UserController.getLoggedInUser(req, res);
    });

}