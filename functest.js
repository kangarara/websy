var reqstring= '/start_server';

var start_server = function () {
	console.log('in start_server');
}
console.log('string = '+ reqstring.substring(1));

eval(reqstring.substring(1))();