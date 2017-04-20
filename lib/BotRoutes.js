var fs = require('fs');
var path = require('path');

module.exports = BotRoutes = function(options) {
    var proto = BotRoutes.prototype;
    proto.listeners = { get: [], post: [], put: [], delete: [] };
    proto.error = {
        code: 404,
        message: "Kindly register listener for Http Endpoint : "
    };

    proto.errorListener = function(context, httpEvent) {
        var e = proto.error;
        e.message = e.message + httpEvent.request.path;
        context.console.log('listener not registered for path : ' + httpEvent.request.path);
        console.error(e);
        context.sendError(e, true);
    }

    proto.staticFilesListener = function(context, httpEvent) {
        var rootPath = process.cwd() + (options.rootPath | "");
        var filePath = rootPath + httpEvent.request.path;
        console.log('request ', httpEvent.request.path);

        if (filePath == rootPath)
            filePath = rootPath+'/index.html';

        var extname = String(path.extname(filePath)).toLowerCase();
        var contentType = 'text/html';
        var mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.svg': 'application/image/svg+xml'
        };

        contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, function(error, content) {
            if (error) {
                if (error.code == 'ENOENT') {
                    proto.errorListener(context, httpEvent);
                    // fs.readFile('./404.html', function(error, content) {
                        // context.sendResponse(content,contentType);
                        // response.writeHead(200, { 'Content-Type': contentType });
                        // response.end(content, 'utf-8');
                    // });
                } else {
                    // response.writeHead(500);
                    context.sendResponse('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                    // response.end();
                }
            } else {
                context.sendResponse(content,contentType);
                // response.writeHead(200, { 'Content-Type': contentType });
                // response.end(content, 'utf-8');
            }
        });
    }

    proto.setErrorHandler = function(errorListener_) {
        if (errorListener_) {
            proto.errorListener = errorListener_;
        }
    }

    proto.on = function(method, url, cb) {
        proto.listeners[method.toLowerCase()].push({
            cb: cb,
            url: url
        });
    }

    proto.urlMatches = function(config, url) {
        if (config instanceof RegExp) return config.test(url);
        if ('function' == typeof config) return config(url);
        return config == url;
    }

    proto.getListener = function(url, method) {
        for (var i = 0, listener; i < proto.listeners[method].length; i++) {
            listener = proto.listeners[method][i];
            if (proto.urlMatches(listener.url, url)) return listener.cb;
        }
    }

    proto.execute = function(context, httpEvent) {
        var url = httpEvent.request.path;
        var method = httpEvent.request.method.toLowerCase();
        console.log(url, method);
        var listener = proto.getListener(url, method);
        if (listener) {
            console.log("Found listener for " + url + " " + listener);
            listener(context, httpEvent);
        } else {
            proto.staticFilesListener(context, httpEvent);
        }
    }

    proto.HttpEndpointHandler = function(context, event) {
        proto.execute(context, event);
    }
}



module.exports = BotRoutes;
