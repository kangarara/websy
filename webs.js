var http = require('http'); 
var url = require('url');
var qs = require('querystring');


var parentServer = http.createServer();
var children = [];


var handleParentReq = function(req,res){

  var reqData = url.parse(req.url);
  var serverData = url.parse(req.url,true);
  console.log(serverData);

  res.writeHead(200, {"Content-Type": "text/html"});
  res.write(ctrlUiHtml());
  // TBD - make this only printed on debug
  res.write('reqData.pathname : ' + reqData.pathname + '\n');
  res.write('reqData.href : ' + reqData.href + '\n');

  // need to validate required data - but that should be in each subcall, no?
  switch (reqData.pathname)
  {
    // new child server - do we pass a closure that returns a string?
    // we take a port # and a 'site descriptor'
    // what if it's missing? well, if the closure is responsible for returning 'a string'
    // then it doesn't matter - it can own its own validation.
    case '/start_server' : 
  	  res.write(startServer(serverData.query.serverName, serverData.query.serverPort));
	  break;
	
    // kill child server
    // takes some sort of server ID, need to indicate if it doesn't exist or not.
    case '/stop_server' :
	  res.write(stopServer(serverData.query.serverName, serverData.query.serverPort));
  	  break;
    // unknown request, return 'bleah'  
    default:
	  res.write('wtf?' + reqData.pathname + '\n');
	
  }
  // always end by listing existing servers
  // how to make this functional rather than procedural? is there actually
  // value in that?
  res.write(listServers());
	
  res.end('Farewell!');
  console.log(serverData);

};


var ctrlUiHtml = function() {
	//TBD need to sort out how to only get 'related' form parameters submitted so I can re-use the names

	return "<form action='http://127.0.0.1:8125/start_server' method='get'>" +
	"<div id=serverDetails>Start server with name :<input type='text' name='serverName' id='serverName'>" +
	"on port: <input type='text' name='serverPort' id='serverPort'>" +
	"<input type='Submit' value='Start'></div></form>" +
	
	"<form action='http://127.0.0.1:8125/stop_server' method='get'>" +
	"<div id=serverDetails>Stop server with name :<input type='text' name='serverName' id='serverName'>" +
	"on port: <input type='text' name='serverPort' id='serverPort'>" +
	"<input type='Submit' value='Stop'></div></form>"
}

var startServer = function(serverName, serverPort) {
	console.log('entering startServer with data ' + serverName + ', ' + serverPort);
	
    //TBD need to figure out how to change to POST so I can have actual JS passed upwards as well.
    // so, need to do a lookup for existing JS in 'serverscripts' and if successfully loaded with name "serverCallback()"
    // use that.
	children[serverName] = http.createServer(function (req, res) {
	    res.writeHead(200, {'Content-Type': 'text/html'});
	    res.end('Hello World of port: ' + serverPort + ' \nI am Server ' + serverName + '\n');
	  });
	children[serverName].port = serverPort;
	children[serverName].listen(serverPort);
	
    return '#running startServer() on port: ' + children[serverName].port + '..\n';
}

var stopServer = function(serverName, serverPort) {
	//TBD add try-catch so as to not take down the parent server if the requested one isn't running
	console.log('entering stopServer with data ' + serverName + ', ' + serverPort);
  	var retString = '#running stopServer() on server: ' + serverName + ' on port ' + serverPort + '..\n';
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
var listServers = function(req) {
	// tbd - need to properly format the output of the names.
    return "#running listServers\n" + children + "\n";
}

parentServer.on('request', handleParentReq);
parentServer.listen(8125);