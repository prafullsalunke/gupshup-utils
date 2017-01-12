/*
    This will maintain 
*/

module.exports = BotRoutes = function() {
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
            proto.errorListener(context, httpEvent);
        }
    }

    proto.HttpEndpointHandler = function(context, event) {
        proto.execute(context, event);
    }
}



module.exports = BotRoutes;
