"use strict";
var fs = require("fs");
var http = require("http");
var statusError = JSON.stringify({ status: 'error' });
var statusSuccess = JSON.stringify({ status: 'success' });
var listHandler = function (request, response, json) {
    var path = './' + json.directory;
    try {
        var stat = fs.statSync(path);
        if (!stat.isDirectory())
            path = './';
    }
    catch (err) {
        response.end(statusError);
    }
    fs.readdir(path, function (err, files) {
        if (files) {
            var info = {};
            info.directories = [];
            info.files = [];
            files.forEach(function (file) {
                try {
                    var stat = fs.statSync(path + '\/' + file);
                    if (stat.isDirectory()) {
                        var value = {};
                        value.name = file;
                        info.directories.push(value);
                    }
                    if (stat.isFile()) {
                        var value = {};
                        value.name = file;
                        info.files.push(value);
                    }
                }
                catch (err) {
                }
            });
            response.end(JSON.stringify(info));
        }
        else {
            response.end(statusError);
        }
        console.log('err:', err);
    });
};
var getHanlder = function (request, response, json) {
    fs.exists('./' + json.filename, function (exists) {
        if (exists) {
            fs.readFile('./' + json.filename, function (err, data) {
                response.end(data);
            });
        }
        else {
            response.end(statusError);
        }
    });
};
var saveHanlder = function (request, response, json) {
    fs.writeFile('./' + json.filename, json.value, function (err) {
        if (err) {
            response.end(statusError);
        }
        else {
            response.end(statusSuccess);
        }
    });
};
var handler = function (request, response) {
    console.log('address:', request.socket.remoteAddress);
    response.writeHead(200, {
        "Content-Type": "application/json",
        "access-control-allow-origin": "*",
        "Access-Control-Allow-Headers": "*"
    });
    if (request.method.toUpperCase() == 'POST') {
        var body = "";
        request.on('data', function (chunk) {
            body += chunk;
        });
        request.on('end', function () {
            console.log('body: ' + body);
            var jsonObj = JSON.parse(body);
            console.log(jsonObj);
            if (request.url.indexOf('\/list') == 0) {
                listHandler(request, response, jsonObj);
            }
            if (request.url.indexOf('\/get') == 0) {
                getHanlder(request, response, jsonObj);
            }
            if (request.url.indexOf('\/save') == 0) {
                saveHanlder(request, response, jsonObj);
            }
        });
    }
    else {
        if (request.url.indexOf('\/get?') == 0) {
            var getObj = {};
            getObj.filename = request.url.substr(5);
            getHanlder(request, response, getObj);
        }
        else {
            var listObj = {};
            listObj.directory = '';
            if (request.url.indexOf('\/list?') == 0) {
                listObj.directory = request.url.substr(6);
            }
            listHandler(request, response, listObj);
        }
    }
};
var server = http.createServer(handler);
//change this to modify the port number you want to listen if it conflicts.
var port = 49923;
server.listen(port);