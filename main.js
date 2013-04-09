var WebSocketServer = require('websocket').server;
var http = require('http');
var express = require('express');
var app = express();

var server = require('http').createServer(app);

app.configure(function() {
	app.use(express.logger('dev'));
	app.use(express.static(__dirname + '/site'));
});

server.listen(8080);

var wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var connections = [];

var broadcast = function(message) {
	connections.forEach(function(connection) {
		console.log((new Date()) + ' Broadcasting: ' + JSON.stringify(message)); 
		connection.sendUTF(JSON.stringify(message));	
	});
};

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);

    connections.push(connection);

    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
	    var payload = JSON.parse(message.utf8Data);
            console.log('Received Message: ' + payload.message);
            broadcast(payload);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
