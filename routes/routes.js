var UserController = require('./userController');

module.exports = function(app) {

    app.get('/', function(req, res) {
        res.render('index');
    });

    app.post('/login', function(req, res) {
        
    });

    app.post('/register', function(req, res) {
        
    });

    app.get('/user', function(req, res) {
        
    });
}