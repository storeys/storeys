define(
    ['require', 'module', 'settings', '../urlresolver', '../../utils/binds', '../../utils/urllib'],
    function(require, module, settings, urlresolver, binds, urllib) {
      var LOG_PREFIX = '[storeys.core.handlers] ';

      var bind = binds.bind(),  // to support `on`, `off`, and `trigger`.
          base = require.toUrl(''),
          context = {},
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
      function extend(a, b) {
        Object.keys(b).some(function(key) {
          a[key] = b[key];
        });
        return a;
      }

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
      function get_response(urlstring, cb) {
        verbose && console.log(LOG_PREFIX + 'get_response(' + urlstring + ')');

        var base  = require.toUrl(''),
            url   = urllib.parse(base + urlstring),
            path  = urllib.relative(base, url.path),
            request;

        context = extend(
            context,
            {
              method: 'GET',
              GET: url.params,
              url: path,
              path: path
            }
        );

        dispatch_middleware(context, function(response) {
          if (typeof response !== 'undefined') {
            verbose && console.log(LOG_PREFIX + 'middleware returns a response(' + urlstring + ')');
            cb(response);
          } else {
            resolve(path, function(params, view) {
              var found = params !== false;
              if (found) {
                // clone to avoid context being polluted by view specifics
                request = extend({}, context);
                request.params = params;
                view(request, cb);
              } else {
                verbose && console.log(LOG_PREFIX + 'found no match for url: ' + urlstring);
              }
            });
          }
        });
      }

      // -------------------------------------------
      //                 Lifecycle
      // -------------------------------------------
      function start() {
        bind.trigger('started');
      }

      function init(config) {
        config  = config || {};
        verbose = config.verbose || false;

        require(
            [settings.ROOT_URLCONF],
            function(spec) {
              verbose && console.log(LOG_PREFIX + 'loaded url spec(' + JSON.stringify(spec) + ')');
              urlspec = spec;
              resolve = urlresolver.create(urlspec);

              load_middleware(function() {
                start();
              });
            }
        );
      }

      init(module.config() || {});

      return {
        on: bind.on,
        off: bind.off,
        get_response: get_response
      }
    }
);
