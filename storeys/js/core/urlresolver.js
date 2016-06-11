define(
    ['require', 'jquery', 'settings', 'module', 'storeys/conf/urls'],
    function(require, $, settings, module, urls) {
      var LOG_PREFIX = '[storeys.core.urls] ',
          EMPTY_REG = /(?:)/;

      var verbose;


      function visit(urlpath, node, params, cb) {
        var resolved = node.regex.match(urlpath);

        if (resolved) {
          verbose && console.log(LOG_PREFIX + 'visit(' + urlpath + ') resolved: ' + resolved + ' with regex: ' + node.regex);
          if (typeof node.next === 'string') {
            verbose && console.log(LOG_PREFIX + 'resolved(lazily initiated): ' + node.next);
            require([node.next], function(fn) {
              cb(resolved.params, fn);
            });
          } else if (typeof node.next === 'function' || 'dispatch' in node.next) {
            verbose && console.log(LOG_PREFIX + 'resolved: ' + node.next);
            cb(resolved.params, node.next);
          } else if (Array.isArray(node.next)) {
            verbose && console.log(LOG_PREFIX + 'array of config.urls: ' + JSON.stringify(node.next));
            loop(node.next.map(function(url) {
              return {urlpath: resolved.remainder, node: url, params: resolved.params};
            }), cb);
          } else if (node.next.conf === 'include') {
            verbose && console.log(LOG_PREFIX + 'segment matched -- include(lazily initiated): ' + node.next.path);
            require([node.next.path], function(urls) {
              verbose && console.log(LOG_PREFIX + 'include(lazily initiated) loaded: ' + node.next.path);
              loop(urls.map(function(url) {
                return {
                  urlpath: resolved.remainder,
                  node: url,
                  params: extend(params, resolved.params)
                };
              }), cb);
            });
          } else {
            console.error(LOG_PREFIX + 'Unhandled condition.');
          }
        } else {
          verbose && console.log(LOG_PREFIX + 'visit(' + urlpath + ') does not match this segment: `' + urlpath + '` with regex: ' + node.regex);
          cb(false);
        }
      }

      function loop(queue, cb) {
        var args;

        if (!queue.length) {
          return cb(false);
        }

        args = queue.shift();
        visit(args.urlpath, args.node, args.params, function(params, view) {
          if (params === false) {
            loop(queue, cb);
          } else {
            cb(params, view);
          }
        });
      }

      // -------------------------------------------
      //                 Reverse
      // -------------------------------------------
      function reverse(viewname, params) {
          get_url_patterns(settings.ROOT_URLCONF, {}, function(named_patterns){
              verbose && console.log(LOG_PREFIX + 'Named patterns: ' + JSON.stringify(named_patterns))

          })
      }

      function get_url_patterns(viewname, patterns, cb){
        var included_paths = []

        require(
        [viewname, 'storeys/utils/datastructures'], function(urlspec, datastructures) {
          var patterns = new datastructures.MultiValueDict();

          $.each(urlspec, function(key, value){
            if(value['next']['conf'] === "include" &&
               value['name'] !== undefined) {
                 throw '`url` with `include` functionality should have an `undefined` name arg';
            } else if (value['next']['conf'] === "include") {
              included_paths.push(value['next']['path']);
            } else if (value['name'] != undefined) {
              patterns.update({[value['name']]: value['regex'].toString()})
            }
          });

          if(included_paths.length != 0){
            $.each(included_paths, function(key, value){
              verbose && console.log(LOG_PREFIX + '`' + value + '` visited')
              patterns.update(get_url_patterns(value, patterns, cb))
            })
          } else {
            cb(patterns)
          }
        });
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

      // ===========================================
      //                 Public
      // ===========================================
      function create(spec) {
        var root;

        if (Array.isArray(spec)) {
            root = urls.url(EMPTY_REG, spec);
        }

        return function(urlpath, cb) {
          loop([{urlpath: urlpath, node: root, params: {}}], cb || function(matched) {
            verbose && console.log(LOG_PREFIX + 'resolve completed. match ' + (matched? '': 'not ') + 'found');
          });
        };
      }

      // ===========================================
      //                  Init
      // ===========================================
      function init(config) {
        verbose = config.verbose || false;
      }

      init(module.config() || {});

      return {
        create: create,
        reverse: reverse,
      };
    }
);
