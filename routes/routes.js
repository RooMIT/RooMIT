/**
 * Author: Olga
 */

var UserController = require('./userController');
var PreferenceController = require('./preferenceController');
var RequestController = require('./requestController');

module.exports = function(app) {

    app.get('/', function(req, res) {
        res.locals.token = req.csrfToken();
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
        Modify a user's availability (and thus all their roommates' availability) 
        or group 

        PUT /users/{id}
        Request Body:
            - available: whether or not they are available (optional)
            - newRoommate: user id of new roommate (optional)
        Response:
            - error: error if there was one
    */
    app.put('/users/:id', function(req, res) {
        UserController.update(req, res);
    });

    /*  
        Create all the preferences (should only be done once)

        POST /preferences/
        Request Body:
        Response:
            - error: error if there was one
    */
    app.post('/preferences/', function(req, res) {
        PreferenceController.create(req, res);
    });

    /*  
        Modify a preference

        PUT /preferences/{id}
        Request Body:
            - response: user's response to a preference
        Response:
            - error: error if there was one
    */
    app.put('/preferences/:id', function(req, res) {
        PreferenceController.update(req, res);
    });

    /*
        Get all requests to/from a user

        GET /user/{id}/requests/
        Request Body: empty
        Response:
            - requestsTo: list of all requests to the user
            - requestsFrom: list of all requests from the user
            - error: error if there was one
    */
    app.get('/users/:id/requests/', function(req, res) {
        RequestController.get(req, res);
    });

    /*  
        Create requests regarding the specified user

        POST /users/{id}/requests/
        Request Body:
            - to: list of ids of users to whom the request is made by the specified user
            - from: list of ids of users making a request to the specified user
        Response:
            - error: error if there was one
    */
    app.post('/users/:id/requests/', function(req, res) {
        RequestController.create(req, res);
    });

    /*  
        Delete requests specified by the body

        DELETE /requests/
        Request Body: 
            - deleteRequests: list of requests to be deleted
        Response:
            - error: error if there was one
    */
    app.delete('/requests/', function(req, res) {
        RequestController.delete(req, res);
    });

}