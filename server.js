var express = require('express');
var app = express();

app.configure(function() {
    app.use(express.static(__dirname + '/dist'));
    app.use(express.errorHandler({
        dumpException: true,
        showStask: true
    }))
});

app.get('/', function(req, res) {
    res.redirect("/index.html");
});

app.listen(process.env.PORT || 8080);
console.log('Started on', process.env.PORT || 8080);