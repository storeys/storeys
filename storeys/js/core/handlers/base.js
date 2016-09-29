define(
    ['require', 'module', 'storeys/conf/settings', 'storeys/core/urlresolver', 'storeys/utils/promise', 'storeys/utils/objectlib'],
    function(require, module, settings, urlresolver, Q, objectlib) {
      var LOG_PREFIX = '[storeys.core.handlers] ';

      var service,
          middlewares,
          urlspec,
          resolve,
          verbose;

      function load_middleware(cb) {
        verbose && console.log(LOG_PREFIX + 'loading middleware');

        get_classes(settings.MIDDLEWARE_CLASSES, function(classes) {
          middlewares = classes;
          cb(middlewares);
        });
      }

      function dispatch_middleware(request, cb) {
        var queue = Array.prototype.slice.apply(middlewares);

        chain(queue, request, cb);
      }

      // -------------------------------------------
      //                 Utilities
      // -------------------------------------------
      function get_classes(classnames, cb) {
        var classpaths,
            classes;

        if (classnames && classnames.length) {
          classes = [];

          classpaths = classnames.map(function(classname) {
            var colon = classname.indexOf(':');
            if (colon > 0) {
              return classname.substring(0, colon);
            } else {
              return classname;
            }
          });
          require(classpaths, function() {
            var modules = Array.prototype.slice.apply(arguments),
                classname, classpath, module,
                name,
                i, len;

            for (i=0, len=classnames.length; i<len; i++) {
              classname = classnames[i];
              classpath = classpaths[i];
              module = modules[i];

              if (classname.length > classpath.length + 1) {
                name = classname.substring(classpath.length + 1);
                module = module[name];
              }
              classes.push(module);
            }
            cb(classes);
          });
        } else {
          cb([]);
        }
      }

      function chain(queue, request, cb) {
        var item;

        if (!queue.length) {
          return cb();
        }

        item = queue.shift();
        item(request, function(response) {
          if (response === false || typeof response === 'undefined') {
            chain(queue, request, cb);
          } else {
            cb(response);
          }
        });
      }

      // ===========================================
      //                  Public
      // ===========================================
      function get_response(req, cb) {
        verbose && console.log(LOG_PREFIX + 'get_response(' + req.path + ') method: ' + req.method);

        dispatch_middleware(req, function(response) {
          if (typeof response !== 'undefined') {
            verbose && console.log(LOG_PREFIX + 'middleware returns a response(' + req.path + ')');
            cb(response);
          } else {
            var path = req.path.indexOf('/') === 0? req.path.substring(1): req.path;
            resolve(path, function(params, view) {
              if (params !== false) {
                request = objectlib.extend({}, req);
                if ('dispatch' in view) {
                  view.dispatch(request, params).then(function(res) {
                    res.view = view;
                    cb(res);
                  });
                } else {
                  view(request, params, function(res) {
                    res.view = view;
                    cb(res);
                  });
                }
              } else {
                verbose && console.warn(LOG_PREFIX + 'found no match for url: ' + req.path);
              }
            });
          }
        });
      }

      // -------------------------------------------
      //                 Lifecycle
      // -------------------------------------------
      function start() {
        return service;
      }

      function init(config) {
        config  = config || {};
        verbose = config.verbose || false;
        service = new Q();

        require(
            [settings.ROOT_URLCONF],
            function(spec) {
              verbose && console.log(LOG_PREFIX + 'loaded url spec(' + JSON.stringify(spec) + ')');
              urlspec = spec;
              resolve = urlresolver.create(urlspec);

              load_middleware(function() {
                service.resolve();
              });
            }
        );
      }

      init(module.config() || {});

      return {
        start: start,
        get_response: get_response
      }
    }
);
