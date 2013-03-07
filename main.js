var WebSocketServer = require('websocket').server;
/* Taken from: http://cjihrig.com/blog/creating-your-own-node-js-websocket-echo-server/
   Thank you!
*/
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
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

var messages = [];
var connections = [];

var broadcast = function() {
	for(var i = 0; i<connections.length; i++) {
		for(var j = 0; j<messages.length; j++) {
			console.log((new Date()) + ' Broadcasting: ' + JSON.stringify(messages[j])); 
			connections[i].sendUTF(JSON.stringify(messages[j]));
		}
	}
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
	    messages.push(payload);	 
            console.log('Received Message: ' + payload.message);
            broadcast();
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
