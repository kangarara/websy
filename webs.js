var http = require('http'); 
var url = require('url');
var qs = require('querystring');
var itemActions = {start: function(serverName, serverPort) {
	console.log('entering start_server with data ' + serverName + ', ' + serverPort);
/*	
	children[serverName] = http.createServer(function (req, res) {
	    res.writeHead(200, {'Content-Type': 'text/html'});
	    res.end('Hello World of port: ' + serverPort + ' \nI am Server ' + serverName + '\n');
	  });
	children[serverName].port = serverPort;
	children[serverName].listen(serverPort);
	
    return '#running startServer() on port: ' + children[serverName].port + '..\n'; */
return ("in start_server\n");
}, 

stop: function(serverName, serverPort) {
	//TBD add try-catch so as to not take down the parent server if the requested one isn't running
	console.log('entering stop_server with data ' + serverName + ', ' + serverPort);
  	var retString = '#running stop_server() on server: ' + serverName + ' on port ' + serverPort + '..\n';
	try {
		children[serverName].close();
		delete children[serverName];
	}
	catch(e)
	{ 
	}
	// TBD - delete isn't how you remove a hash key. How? children[serverName].delete();
    return retString;
}
};


var parentServer = http.createServer();
var children = [];


var handleParentReq = function(request,res){
	console.log(request);
	var body = '';
	var postData = '';

	if (request.method == 'POST') {
		// TBD could validate the URLs at this point maybe before moving on, could also pass the name of
		// the URL (start_server, stop_server) to the function and let it deal with it.
		
		// REST-ful might be better. Then it could be /server/start instead.
		console.log ("the request url is " + request.url + "\n");
	        request.on('data', function (data) {
	            body += data;
	        });
	        request.on('end', function () {
			    postData = qs.parse(body);
			    // use POST
			    console.log("Post data is:\n...\n");
				console.log(postData);
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write(ctrlUiHtml());
				console.log("returend postdata is " + JSON.stringify(postData));
				
				// TBD, now figure out how to 'call' or invoke request.url.substring(1)
				// yes, I know 'eval' blows. I don't want to use 'eval'. I may instead create (as suggested)
				// a dictionary of possible commands. 
				console.log("request name = " + request.url.substring(1) + "\n");
				reqname = request.url.substring(1);
				console.log("reqname = " +reqname + "\n");
				console.log(itemActions[reqname]);
				
				res.write((itemActions[reqname])(postData.serverName, postData.serverPort));
				res.end();
	        });
	    }
	else {
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(ctrlUiHtml());
		res.end();
		
	}
};



var ctrlUiHtml = function() {

	return "<form action='http://127.0.0.1:8125/start' method='post'>" +
	"<div id=serverDetails>Start server with name :<input type='text' name='serverName' id='serverName'>" +
	"on port: <input type='text' name='serverPort' id='serverPort'>" +
	"<input type='Submit' value='Start'></div></form>" +
	
	"<form action='http://127.0.0.1:8125/stop' method='post'>" +
	"<div id=serverDetails>Stop server with name :<input type='text' name='serverName' id='serverName'>" +
	"on port: <input type='text' name='serverPort' id='serverPort'>" +
	"<input type='Submit' value='Stop'></div></form>"
}
/*
var start_server = function(serverName, serverPort) {
	console.log('entering start_server with data ' + serverName + ', ' + serverPort);
	
	children[serverName] = http.createServer(function (req, res) {
	    res.writeHead(200, {'Content-Type': 'text/html'});
	    res.end('Hello World of port: ' + serverPort + ' \nI am Server ' + serverName + '\n');
	  });
	children[serverName].port = serverPort;
	children[serverName].listen(serverPort);
	
    return '#running startServer() on port: ' + children[serverName].port + '..\n'; 
return ("in start_server\n");
}

var stop_server = function(serverName, serverPort) {
	//TBD add try-catch so as to not take down the parent server if the requested one isn't running
	console.log('entering stop_server with data ' + serverName + ', ' + serverPort);
  	var retString = '#running stop_server() on server: ' + serverName + ' on port ' + serverPort + '..\n';
	try {
		children[serverName].close();
		delete children[serverName];
	}
	catch(e)
	{ 
	}
	// TBD - delete isn't how you remove a hash key. How? children[serverName].delete();
    return retString;
}
*/
var list_servers = function(req) {
	// tbd - need to properly format the output of the names.
    return "#running listServers\n" + JSON.stringify(children) + "\n";
}

parentServer.on('request', handleParentReq);
parentServer.listen(8125);