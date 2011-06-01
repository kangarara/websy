// Load 'em up.
var http = require('http'); 
var url = require('url');
var qs = require('querystring');

// TBD - ideally, I'd like to create a dictionary of request types/callbacks but 
// a) couldn't get it working within 15 minutes (still a JS newbie) and 
// b) that's kind of overkill for this type of PoC
// left in as a reminder/example for later. 
// var itemActions = {start: startServer, stop: stopServer};

// Global objects
var parentServer = http.createServer();
var children = [];

// The master web server that spawns the children is not killable.
var handleParentReq = function(req, res) {

//  console.log(req);
  var body = '';
  var postData = '';

  // all GET requests are ignored (other than to redisplay base UI)
  if (req.method == 'POST') {

    // Handle post continuum 
    req.on('data', function (data) {
      body += data;
    });
    
    // Have all the post data
    req.on('end', function () {
      postData = qs.parse(body);      

      action = req.url.substring(1);
      console.log("action is " + action);
      
      res.writeHead(200, {"Content-Type": "text/html"});
      res.write(headerUiHtml());
    
      // TBD could validate the URLs at this point maybe before moving on, could also pass the name of
      // the URL (start_server, stop_server) to the function and let it deal with it.
      // need to validate required data - but that should be in each subcall, no?
      switch (action)
      {
        // new child server - do we pass a closure that returns a string?
        // we take a port # and a 'site descriptor'
        // what if it's missing? well, if the closure is responsible for returning 'a string'
        // then it doesn't matter - it can own its own validation.
        case 'start' : 
          res.write(startServer(postData.serverName, postData.serverPort, postData.serverScript));
          res.write(listServers(children));    
          res.end();          
          break;
  
        // kill child server
        // takes some sort of server ID, need to indicate if it doesn't exist or not.
        case 'stop' :
          res.write(stopServer(postData.serverName, postData.serverPort));
          res.write(listServers());    
          res.end();
          break;
      
        // unknown request, return 'bleah'  
        default:
          res.write('Sorry, I didn\'t get that? ' + action + 'is not a supported action.\n');
          res.write(listServers(children));    
          res.end();
      }    
    }); 
  } // if 'post' 
  else
  {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(headerUiHtml());
    res.write(listServers(children));    
    res.end();
    console.log("get received");
  }

  
};


var headerUiHtml = function() {
  // again, in an ideal world, the URL/port would be in a config file.
  return "<form action='http://127.0.0.1:8125/start' method='post'>" 
  + "<div id=serverDetails>Start server with name :<input type='text' name='serverName' id='serverName'>"
  + "on port: <input type='text' name='serverPort' id='serverPort'>" 
  + "with script: <input type='textarea' name='serverScript' id='serverScript'>"
  + "<input type='Submit' value='Start'></div></form>" ;
}


// kick off a new server with the supplied script
// TBD - would prefer to have a library of server scripts to use (as well as the option to supply)
// a custom script, but time forbade.
var startServer = function(serverName, serverPort, serverScript) {
  // no validation. If someone refreshes the post form without parameters, this will hang.
  console.log('entering startServer with data ' + serverName + ', ' + serverPort);
  console.log('callback function = ' + serverScript);

  children[serverName] = http.createServer(function (req, res) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('Hello World of port: ' + serverPort 
          + ' \nI am Server ' + serverName + '.\n'
          + 'Your callback script is ' + serverScript + '.\n');
    });
  children[serverName].port = serverPort;
  children[serverName].script = serverScript;
  children[serverName].listen(serverPort);  
  return 'Started server ' + serverName + ' on port: ' + children[serverName].port 
    + 'with script ' + serverScript + '  \n'; 
}


// stop an existing server
var stopServer = function(serverName, serverPort) {

  console.log('entering stopServer with data ' + serverName + ', ' + serverPort);
  try {
    children[serverName].close();
    delete children[serverName];
  }
  catch(e)
  { 
    console.log('in the catch!');
  }
  
  return 'Shutting down server: ' + serverName + ' on port ' + serverPort + '..\n';
}

var listServers = function() {
  var rt = '';
  for (serverName in children) { 
      rt += " remaining servers "+serverName+" "
         +children[serverName].port+" "
         +children[serverName].script+" "; }

  console.log (rt);
  console.log("in listservers");
  console.log ("children = "+ JSON.stringify(children));
  
  var resp = "";
  resp += "<table><tr><td>Server</td><td>Port</td><td>Script</td><td>Command</td></tr>";
  
  for (serverName in children) { 
    // Skip null, undefined, and nonexistent elements // 
    resp += "<tr><td><a href='http://127.0.0.1:"+children[serverName].port+"/' target='_blank'>"
         +serverName+"</a></td><td>"
         +children[serverName].port+"</td><td>"
         +children[serverName].script+"</td><td>"
           +"<form action='http://127.0.0.1:8125/stop' method='post'>" 
           + "<input type='hidden' name='serverName' value='" + serverName + "'>"
           + "<input type='hidden' name='serverPort' value='" + children[serverName].port + "'>" 
           + "<input type='Submit' value='stop'></div></form></td></tr>";

    
  }
  resp += "</table>";
  return resp;
}

// Kick things off. Ideally I'd have the port # in a config file.
parentServer.on('request', handleParentReq);
parentServer.listen(8125);