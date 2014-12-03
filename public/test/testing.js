/**
 * Author: Rujia
 */

$.ajaxPrefilter(function(options, _, xhr) {
    if (!xhr.crossDomain) {
        var token = $('meta[name="csrf-token"]').attr('content');
        xhr.setRequestHeader('X-CSRF-Token', token);
    }
});

var name = 'testuser';
var password = 'beans';
var connectionString = 'http://localhost:8080/';

asyncTest('Register a user', function() {
    registerUser(function(user) {
        equal(user.name, name, 'Name is correct');
        ok(user.preferences.length, 'Preferences are present');
        ok(user.available, 'User is initially available');
        equal(user.group, undefined, 'User initially has no group');
        
        deleteUser(user._id, function() {
            start();
        });
    });
});

asyncTest('Log in a user', function() {
    registerUser(function(user1) {
        login(user1.email, password, function(response) {
            var user = response.user;
            equal(user.name, name, 'Name is correct');
            equal(user.email, user1.email, 'Email is correct');
            equal(user._id, user1._id, 'User id is correct')
            
            deleteUser(user1._id, function() {
                start();
            });
        });
    });
});

asyncTest('Get a user', function() {
    registerUser(function(user1) {
        getUser(user1._id, function(response) {
            var user = response.user;
            equal(user.name, name, 'Name is correct');
            equal(user.email, user1.email, 'Email is correct');
            equal(user._id, user1._id, 'User id is correct')
            
            deleteUser(user1._id, function() {
                start();
            });
        });
    });
});

asyncTest('Get suggestions', function() {
    registerUser(function(user) {
        getSuggestions(function(response) {
            var suggestions = response.suggestions;
            ok(suggestions, 'There are suggestions');
            
            deleteUser(user._id, function() {
                start();
            });
        });
    });
});

asyncTest('Modify preferences', function() {
    registerUser(function(user1) {
        getUser(user1._id, function(response) {
            var user = response.user;
            var preference = user.preferences[0];
            equal(preference.response, 'Don\'t Care', 'Preference response is initially Don\'t Care');
            
            // make response Yes
            modifyPreference(preference._id, preference.description, 'Yes', function(response) {
                ok(response.success, 'Modified preference')

                getUser(user1._id, function(response) {
                    var preference2 = response.user.preferences[0];
                    equal(preference2.response, 'Yes', 'Preference response is now Yes');
                    equal(preference.description, preference2.description, 'Description is the same');
                    
                    // make response No
                    modifyPreference(preference2._id, preference2.description, 'No', function(response) {
                        ok(response.success, 'Modified preference')

                        getUser(user1._id, function(response) {
                            var preference3 = response.user.preferences[0];
                            equal(preference3.response, 'No', 'Preference response is now No');
                            equal(preference.description, preference2.description, 'Description is the same');
                            
                            deleteUser(user1._id, function() {
                                start();
                            });
                        }); 
                    });
                }); 
            });
        });
    });
});

asyncTest('Modify availability', function() {
    registerUser(function(user1) {
        // check that user available
        getUser(user1._id, function(response) {
            ok(response.user.available, 'User initially available');

            // make unavailable
            modifyUserAvailability(user1._id, false, function(response) {
                ok(response.success, 'Modified availability');

                // should be unavailable
                getUser(user1._id, function(response) {
                    ok(response.user.available === false, 'Availability is false');

                    // make available
                    modifyUserAvailability(user1._id, true, function(response) {
                        ok(response.success, 'Modified availability');

                        // should be available
                        getUser(user1._id, function(response) {
                            ok(response.user.available, 'Availability is true');
                            
                            deleteUser(user1._id, function() {
                                start();
                            });
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Make a request', function() {
    registerTwoUsers(function(user1, user2) {

        // make sure there are no requests
        getBothRequests(user1._id, user2._id, function(response1, response2) {
            var reqTo1 = response1.requestsTo;
            var reqTo2 = response2.requestsTo;
            var reqFrom1 = response1.requestsFrom;
            var reqFrom2 = response2.requestsFrom;

            equal(reqTo1.length, 0, 'No requests to user1');
            equal(reqFrom2.length, 0, 'No requests from user2');
            equal(reqTo2.length, 0, 'No requests to user2');
            equal(reqFrom1.length, 0, 'No requests from user1');

            createRequest(user1._id, user2._id, function(response) {
                ok(response.success, 'Created request');

                // should be one request from user1 to user2
                getBothRequests(user1._id, user2._id, function(response1, response2) {
                    var reqTo1 = response1.requestsTo;
                    var reqTo2 = response2.requestsTo;
                    var reqFrom1 = response1.requestsFrom;
                    var reqFrom2 = response2.requestsFrom;

                    equal(reqTo1.length, 0, 'No requests to user1');
                    equal(reqFrom2.length, 0, 'No requests from user2');
                    equal(reqTo2.length, 1, 'One request to user2');
                    equal(reqFrom1.length, 1, 'One request from user1');

                    equal(reqTo2[0].to._id, user2._id, 'Request to user2 is to user2');
                    equal(reqTo2[0].from._id, user1._id, 'Request to user2 is from user1');
                    equal(reqFrom1[0].to._id, user2._id, 'Request from user1 is to user2');
                    equal(reqFrom1[0].from._id, user1._id, 'Request from user1 is from user1');
                    
                    deleteTwoUsers(user1._id, user2._id, function() {
                        start();
                    });
                });
            });
        });
    });
});

asyncTest('Make and accept request', function() {
    registerTwoUsers(function(user1, user2) {
        createRequest(user1._id, user2._id, function(response) {
            ok(response.success);

            // should be 1 request
            getBothRequests(user1._id, user2._id, function(response1, response2) {
                var reqTo1 = response1.requestsTo;
                var reqTo2 = response2.requestsTo;
                var reqFrom1 = response1.requestsFrom;
                var reqFrom2 = response2.requestsFrom;

                equal(reqTo1.length, 0, 'No requests to user1');
                equal(reqFrom2.length, 0, 'No requests from user2');
                equal(reqTo2.length, 1, 'One request to user2');
                equal(reqFrom1.length, 1, 'One request from user1');

                equal(reqTo2[0].to._id, user2._id, 'Request to user2 is to user2');
                equal(reqTo2[0].from._id, user1._id, 'Request to user2 is from user1');
                equal(reqFrom1[0].to._id, user2._id, 'Request from user1 is to user2');
                equal(reqFrom1[0].from._id, user1._id, 'Request from user1 is from user1');

                modifyRequest(user1._id, user2._id, true, false, false, function(response) {
                    ok(response.success, 'Modified request');

                    // should be no requests
                    getBothRequests(user1._id, user2._id, function(response1, response2) {
                        var reqTo1 = response1.requestsTo;
                        var reqTo2 = response2.requestsTo;
                        var reqFrom1 = response1.requestsFrom;
                        var reqFrom2 = response2.requestsFrom;

                        equal(reqTo1.length, 0, 'No requests to user1');
                        equal(reqFrom2.length, 0, 'No requests from user2');
                        equal(reqTo2.length, 0, 'No requests to user2');
                        equal(reqFrom1.length, 0, 'No requests from user1');
                        
                        deleteTwoUsers(user1._id, user2._id, function() {
                            start();
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Make and deny request', function() {
    registerTwoUsers(function(user1, user2) {
        createRequest(user1._id, user2._id, function(response) {
            ok(response.success);

            // should be 1 request
            getBothRequests(user1._id, user2._id, function(response1, response2) {
                var reqTo1 = response1.requestsTo;
                var reqTo2 = response2.requestsTo;
                var reqFrom1 = response1.requestsFrom;
                var reqFrom2 = response2.requestsFrom;

                equal(reqTo1.length, 0, 'No requests to user1');
                equal(reqFrom2.length, 0, 'No requests from user2');
                equal(reqTo2.length, 1, 'One request to user2');
                equal(reqFrom1.length, 1, 'One request from user1');

                equal(reqTo2[0].to._id, user2._id, 'Request to user2 is to user2');
                equal(reqTo2[0].from._id, user1._id, 'Request to user2 is from user1');
                equal(reqFrom1[0].to._id, user2._id, 'Request from user1 is to user2');
                equal(reqFrom1[0].from._id, user1._id, 'Request from user1 is from user1');

                modifyRequest(user1._id, user2._id, false, true, false, function(response) {
                    ok(response.success);

                    // should be no requests
                    getBothRequests(user1._id, user2._id, function(response1, response2) {
                        var reqTo1 = response1.requestsTo;
                        var reqTo2 = response2.requestsTo;
                        var reqFrom1 = response1.requestsFrom;
                        var reqFrom2 = response2.requestsFrom;

                        equal(reqTo1.length, 0, 'No requests to user1');
                        equal(reqFrom2.length, 0, 'No requests from user2');
                        equal(reqTo2.length, 0, 'No requests to user2');
                        equal(reqFrom1.length, 0, 'No requests from user1');
                        
                        deleteTwoUsers(user1._id, user2._id, function() {
                            start();
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Make and cancel request', function() {
    registerTwoUsers(function(user1, user2) {
        createRequest(user1._id, user2._id, function(response) {
            ok(response.success);

            getBothRequests(user1._id, user2._id, function(response1, response2) {
                var reqTo1 = response1.requestsTo;
                var reqTo2 = response2.requestsTo;
                var reqFrom1 = response1.requestsFrom;
                var reqFrom2 = response2.requestsFrom;

                equal(reqTo1.length, 0, 'No requests to user1');
                equal(reqFrom2.length, 0, 'No requests from user2');
                equal(reqTo2.length, 1, 'One request to user2');
                equal(reqFrom1.length, 1, 'One request from user1');

                equal(reqTo2[0].to._id, user2._id, 'Request to user2 is to user2');
                equal(reqTo2[0].from._id, user1._id, 'Request to user2 is from user1');
                equal(reqFrom1[0].to._id, user2._id, 'Request from user1 is to user2');
                equal(reqFrom1[0].from._id, user1._id, 'Request from user1 is from user1');

                // cancel request
                modifyRequest(user1._id, user2._id, false, false, true, function(response) {
                    ok(response.success, 'Modified request');

                    getBothRequests(user1._id, user2._id, function(response1, response2) {
                        var reqTo1 = response1.requestsTo;
                        var reqTo2 = response2.requestsTo;
                        var reqFrom1 = response1.requestsFrom;
                        var reqFrom2 = response2.requestsFrom;

                        equal(reqTo1.length, 0, 'No requests to user1');
                        equal(reqFrom2.length, 0, 'No requests from user2');
                        equal(reqTo2.length, 0, 'No requests to user2');
                        equal(reqFrom1.length, 0, 'No requests from user1');
                        
                        deleteTwoUsers(user1._id, user2._id, function() {
                            start();
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Add roommate', function() {
    registerTwoUsers(function(user1, user2) {
        // both have no roommates
        getBothRoommates(user1._id, user2._id, function(roommates1, roommates2) {
            equal(roommates1.length, 0, 'User1 has no roommates');
            equal(roommates2.length, 0, 'User2 has no roommates');
                
            makeRoommates(user1._id, user2._id, function(response) {
                ok(response.success, 'Made roommates');

                // check that they both have each other
                getBothUsers(user1._id, user2._id, function(user1, user2) {
                    var group1 = user1.group;
                    var group2 = user2.group;
                    ok(group1 !== undefined, 'User1 has a group'); 
                    ok(group2 !== undefined, 'User2 has a group');
                    equal(group1, group2, 'User1 and user2 are in the same group');

                    getBothRoommates(user1._id, user2._id, function(roommates1, roommates2) {
                        same(roommates1, [user2._id], 'User1 is roommates with only user2');
                        same(roommates2, [user1._id], 'User2 is roommates with only user1');
                        
                        deleteTwoUsers(user1._id, user2._id, function() {
                            start();
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Remove roommate', function() {
    registerTwoUsers(function(user1, user2) {
        makeRoommates(user1._id, user2._id, function(response) {
            ok(response.success, 'Made roommates');

            // check that they both have each other
            getBothUsers(user1._id, user2._id, function(user1, user2) {
                var group1 = user1.group;
                var group2 = user2.group;
                ok(group1 !== undefined, 'User1 has a group'); 
                ok(group2 !== undefined, 'User2 has a group');
                equal(group1, group2, 'User1 and user2 are in the same group');

                getBothRoommates(user1._id, user2._id, function(roommates1, roommates2) {
                    same(roommates1, [user2._id], 'User1 is roommates with only user2');
                    same(roommates2, [user1._id], 'User2 is roommates with only user1');
                        
                    // disband group
                    leaveGroup(user1._id, function(response) {
                        ok(response.success, 'Left group');

                        // check that they no longer have each other
                        getBothUsers(user1._id, user2._id, function(user1, user2) {
                            var group1 = user1.group;
                            var group2 = user2.group;
                            ok(group1 === undefined, 'User1 has no group'); 
                            ok(group2 ===  undefined, 'User2 has no group');

                            getBothRoommates(user1._id, user2._id, function(roommates1, roommates2) {
                                same(roommates1, [], 'User1 has no roommates');
                                same(roommates2, [], 'User2 has no roommates');
                                
                                deleteTwoUsers(user1._id, user2._id, function() {
                                    start();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Modify availability with roommates', function() {
    registerTwoUsers(function(user1, user2) {
        makeRoommates(user1._id, user2._id, function(response) {
            ok(response.success);

            // check that they are both available
            getBothUsers(user1._id, user2._id, function(user1, user2) {
                ok(user1.available, 'User1 is available'); 
                ok(user2.available, 'User2 is available');

                // make one unavailable
                modifyUserAvailability(user1._id, false, function(response) {
                    ok(response.success, 'Modified availability');

                    // both should be unavailable
                    getBothUsers(user1._id, user2._id, function(user1, user2) {
                        ok(user1.available === false, 'User1 is unavailable'); 
                        ok(user2.available === false, 'User2 is available');

                        // make one available
                        modifyUserAvailability(user2._id, true, function(response) {
                            ok(response.success, 'Modified availability');

                            // both should be available
                            getBothUsers(user1._id, user2._id, function(user1, user2) {
                                ok(user1.available, 'User1 is available'); 
                                ok(user2.available, 'User2 is available');
                                
                                deleteTwoUsers(user1._id, user2._id, function() {
                                    start();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Send request to group of two', function() {
    registerTwoUsers(function(user1, user2) {  
        makeRoommates(user1._id, user2._id, function(response) {
            ok(response.success, 'Made roommates')

            registerUser(function(user3) {

                // user 3 sends request to user2 (roommates with user1)
                createRequest(user3._id, user2._id, function(response) {
                    ok(response.success, 'Created request');

                    // check that both got the request
                    getBothRequests(user1._id, user2._id, function(response1, response2) {
                        var reqTo1 = response1.requestsTo;
                        var reqTo2 = response2.requestsTo;

                        equal(reqTo1.length, 1, 'There is one request to user1');
                        equal(reqTo2.length, 1, 'There is one request to user2');

                        equal(reqTo1[0].from._id, user3._id, 'Request to user1 is from user3');
                        equal(reqTo2[0].from._id, user3._id, 'Request to user2 is from user3');
                        
                        deleteThreeUsers(user1._id, user2._id, user3._id, function() {
                            start();
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Send request to group of two, accept it', function() {
    registerThreeUsers(function(user1, user2, user3) {  
        makeRoommates(user1._id, user2._id, function(response) {
            ok(response.success, 'Made rooommates')

            // user 3 sends request to user2 (roommates with user1)
            createRequest(user3._id, user2._id, function(response) {
                ok(response.success, 'Created request');

                // both accept the request
                modifyRequest(user3._id, user1._id, true, false, false, function(response) {
                    modifyRequest(user3._id, user2._id, true, false, false, function(response) {
                        
                        // check that they all have each other
                        getThreeUsers(user1._id, user2._id, user3._id, function(user1, user2, user3) {
                            var group1 = user1.group;
                            var group2 = user2.group;
                            var group3 = user3.group;
                            ok(group1 !== undefined, 'User1 has a group'); 
                            ok(group2 !== undefined, 'User2 has a group');
                            ok(group3 !== undefined, 'User3 has a group');
                            equal(group1, group2, 'User1 and user2 are in the same group');
                            equal(group1, group3, 'User1 and user3 are in the same group');
                            
                            getRoommatesForThreeUsers(user1._id, user2._id, user3._id, function(roommates1, roommates2, roommates3) {
                                equal(roommates1.length, 2, 'User1 has 2 roommates');
                                equal(roommates2.length, 2, 'User2 has 2 roommates');
                                equal(roommates3.length, 2, 'User3 has 2 roommates');

                                ok(roommates1.indexOf(user2._id) > -1, 'User1 is roommates with user2');
                                ok(roommates1.indexOf(user3._id) > -1, 'User1 is roommates with user3');

                                ok(roommates2.indexOf(user1._id) > -1, 'User2 is roommates with user1');
                                ok(roommates2.indexOf(user3._id) > -1, 'User2 is roommates with user3');

                                ok(roommates3.indexOf(user1._id) > -1, 'User3 is roommates with user1');
                                ok(roommates3.indexOf(user2._id) > -1, 'User3 is roommates with user2');
                                
                                deleteThreeUsers(user1._id, user2._id, user3._id, function() {
                                    start();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Send request to group of two, one denies, one accepts it', function() {
    registerThreeUsers(function(user1, user2, user3) {  
        makeRoommates(user1._id, user2._id, function(response) {
            ok(response.success, 'Made roommates')

            // user 3 sends request to user2 (roommates with user1)
            createRequest(user3._id, user2._id, function(response) {
                ok(response.success, 'Made request');

                // one denies the request, one accepts
                modifyRequest(user3._id, user1._id, false, true, false, function(response) {
                    modifyRequest(user3._id, user2._id, true, false, false, function(response) {
                        
                        // check that they are not roommates
                        getThreeUsers(user1._id, user2._id, user3._id, function(user1, user2, user3) {
                            var group1 = user1.group;
                            var group2 = user2.group;
                            var group3 = user3.group;
                            ok(group1 !== undefined, 'User1 has a group'); 
                            ok(group2 !== undefined, 'User2 has a group');
                            ok(group3 === undefined, 'User3 does not have a group');
                            equal(group1, group2, 'User1 and user2 are in the same group');
                            
                            // check that the request is gone
                            getBothRequests(user1._id, user2._id, function(response1, response2) {
                                var reqTo1 = response1.requestsTo;
                                var reqTo2 = response2.requestsTo;

                                equal(reqTo1.length, 0, 'No requests to user1');
                                equal(reqTo2.length, 0, 'No requests to user2');
                                
                                deleteThreeUsers(user1._id, user2._id, user3._id, function() {
                                    start();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

asyncTest('Send request to group of two, cancel it', function() {
    registerThreeUsers(function(user1, user2, user3) {  
        makeRoommates(user1._id, user2._id, function(response) {
            ok(response.success, 'Made roommates')

            // user 3 sends request to user2 (roommates with user1)
            createRequest(user3._id, user2._id, function(response) {
                ok(response.success, 'Created request');

                // cancel request to user1
                modifyRequest(user3._id, user1._id, false, false, true, function(response) {
                      
                    // check that the request to both is gone
                    getBothRequests(user1._id, user2._id, function(response1, response2) {
                        var reqTo1 = response1.requestsTo;
                        var reqTo2 = response2.requestsTo;

                        equal(reqTo1.length, 0, 'No requests to user1');
                        equal(reqTo2.length, 0, 'No requests to user2');
                        
                        deleteThreeUsers(user1._id, user2._id, user3._id, function() {
                            start();
                        });
                    });
                });
            });
        });
    });
});


/**
* Helper methods to make tests less akin to callback hell
*/

function makeRoommates(userId1, userId2, callback) {
    // request and accept
    createRequest(userId1, userId2, function(response) {
        modifyRequest(userId1, userId2, true, false, false, callback);
    });
}

function getBothUsers(userId1, userId2, callback) {
    getUser(userId1, function(response1) {
        getUser(userId2, function(response2) {
            callback(response1.user, response2.user);
        });
    });
}

function getThreeUsers(userId1, userId2, userId3, callback) {
    getUser(userId1, function(response1) {
        getUser(userId2, function(response2) {
            getUser(userId3, function(response3) {
                callback(response1.user, response2.user, response3.user);
            });
        });
    });
}

function getBothRoommates(userId1, userId2, callback) {
    getRoommates(userId1, function(response1) {
        getRoommates(userId2, function(response2) {
            callback(response1.roommates, response2.roommates);
        });
    });
}

function getRoommatesForThreeUsers(userId1, userId2, userId3, callback) {
    getRoommates(userId1, function(response1) {
        getRoommates(userId2, function(response2) {
            getRoommates(userId3, function(response3) {
                callback(response1.roommates, response2.roommates, response3.roommates);
            });
        });
    });
}

function getBothRequests(userId1, userId2, callback) {
    getRequests(userId1, function(response1) {
        getRequests(userId2, function(response2) {
            callback(response1, response2);
        });
    });
}

function registerThreeUsers(callback) {
    registerUser(function(user1) {
        registerUser(function(user2) {
            registerUser(function(user3) {
                callback(user1, user2, user3);
            });
        });
    });
}

function registerTwoUsers(callback) {
    registerUser(function(user1) {
        registerUser(function(user2) {
            callback(user1, user2);
        });
    });
}

function registerUser(callback) {
    var email = randomString() + '@mit.edu';
    registerWithoutTest(name, email, password, function(response) {
        callback(response.user);
    });
}

function login(email, password, callback) {
    ajax({email: email, password: password}, '/login/', 'POST', 'Login', callback);
}

function register(name, email, password, callback) {
    ajax({name: name, email: email, password: password}, '/users/', 'POST', 'Register', callback);
}

function logout(callback) {
    ajax({}, '/logout/', 'POST', 'Logout', callback);
}

function getUser(userId, callback) {
    ajax({}, '/users/' + userId, 'GET', 'Get user', callback);
}

function getSuggestions(callback) {
    ajax({}, '/suggestions/', 'GET', 'Get suggestions', callback);
}

function leaveGroup(userId, callback) {
    ajax({leaveGroup: true}, '/users/' + userId, 'PUT', 'Leave group', callback);
}

function modifyUserAvailability(userId, available, callback) {
    ajax({available: available}, '/users/' + userId, 'PUT', 'Modify user availability', callback);
}

function modifyPreference(preferenceId, description, response, callback) {
    ajax({response: response, description: description}, '/preferences/' + preferenceId, 'PUT', 'Modify preferences', callback);
}

function getRoommates(userId, callback) {
    ajax({}, '/users/' + userId + '/roommates', 'GET', 'Get roommates', callback);
}

function getRequests(userId, callback) {
    ajax({}, '/users/' + userId + '/requests', 'GET', 'Get requests', callback);
}

function createRequest(from, to, callback) {
    ajax({}, '/users/' + from + '/requests/to/' + to, 'POST', 'Make a request', callback);
}

function modifyRequest(from, to, accept, deny, cancel, callback) {
    ajax({deny: deny, cancel: cancel, accept: accept}, '/users/' + from + '/requests/to/' + to, 'PUT', 'Modify request', callback);
}

function deleteUser(userId, callback) {
    $.ajax({
        url: '/users/' + userId,
        type: 'DELETE'
    }).done(function(response) {
        callback(response);
    }).fail(function(error) {
        console.log(error);
    });
}

function deleteTwoUsers(userId1, userId2, callback) {
    deleteUser(userId1, function() {
        deleteUser(userId2, callback);
    });
}

function deleteThreeUsers(userId1, userId2, userId3, callback) {
    deleteUser(userId1, function() {
        deleteUser(userId2, function() {
            deleteUser(userId3, callback);
        });
    });
}

function registerWithoutTest(name, email, password, callback) {
    $.post(
        '/users',
        { name: name, email: email, password: password }
    ).done(function(response) {
        callback(response);
    }).fail(function(error) {
        console.log(error);
    });
}

function ajax(params, url, restType, testName, success) {
    if (restType != 'DELETE' && restType != 'PUT' && restType != 'POST') {
        restType = 'GET';
    }

    $.ajax({
        url         : url,
        type        : restType,
        data        : params,
        dataType    : 'json',
        beforeSend  : function() {},
        error       : function() {ok(false, testName); start()},
        success     : function(data) {ok(true, testName); success(data);}
    });
}

// returns a random 10 character string
function randomString() {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i=0; i < 10; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}