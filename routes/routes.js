var UserController = require('./userController');
var PreferenceController = require('./preferenceController');

module.exports = function(app) {

    app.get('/', function(req, res) {
        res.render('index');
    });

    /* 
        Logs in the user, creates session

        POST /login
        Request Body:
            - email: MIT email
            - password: password
        Response:
            - user: user
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
            - user: user
            - error: error if there was one
    */
    app.post('/users', function(req, res) {
        UserController.create(req, res);
    });

    /*
        Get all users

        GET /users
        Request Body: empty
        Response:
            - users: a list of all users
            - error: error if there was one
    */
    app.get('/users', function(req, res) {
        UserController.getAll(req, res);
    }); 

    /*  
        Get a particular user

        GET /users/{id}
        Request Body: empty
        Response:
            - user: the user
            - error: error if there was one
    */
    app.get('/users/:id', function(req, res) {
        UserController.get(req, res);
    });

    /*
        Get all users the particular user has under requested

        GET /users/{id}/requested
        Request Body: empty
        Response: 
            - users: list of requested users
            - error: error if there was one
    */
    app.get('/users/:id/requested', function(req, res) {
        UserController.getRequested(req, res);
    });

    /*
        Get all users who are roommates of the particular user

        GET /users/{id}/roommates
        Request Body: empty
        Response: 
            - users: list of roommates
            - error: error if there was one
    */
    app.get('/users/:id/roommates', function(req, res) {
        UserController.getRoommates(req, res);
    });
    
    /*  
        Get all the users that match the logged in user
        and the percentage they match

        GET /matches
        Request Body: empty
        Response:
            - matches: list of users and percentages { user1: .8, ...}
            - error: error if there was one
    */
    app.get('/matches', function(req, res) {
        UserController.getMatches(req, res);
    });

    /*  
        Modify a user

        POST /users/{id}
        Request Body:
            - available: whether or not they are available (optional)
            - roommates: roommates list (optional)
            - requested: list of requested users (optional)
        Response:
            - error: error if there was one
    */
    app.post('/users/:id', function(req, res) {
        UserController.update(req, res);
    });

    /*  
        Modify a preference

        POST /preferences/{id}
        Request Body:
            - response: user's response to a preference
        Response:
            - error: error if there was one
    */
    app.post('/preferences/:id', function(req, res) {
        PreferenceController.update(req, res);
    });

}