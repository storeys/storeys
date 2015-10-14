define(
    ['require', 'module', 'underscore', '../conf/urls'],
    function(require, module, _, urls) {
      var LOG_PREFIX = '[storeys.core.urls] ',
          EMPTY_REG = /(?:)/;

      var verbose;

      function visit(urlpath, node, params) {
        var resolved = node.regex.match(urlpath),
            matched = false;

        verbose && console.log(LOG_PREFIX + 'visit(' + urlpath + ') resolved: ' + resolved + ' with regex: ' + node.regex);
        if (resolved) {
          if (typeof node.next === 'function') {
            verbose && console.log(LOG_PREFIX + 'view: ' + node.next);
            matched = true;
            node.next();
          } else if (typeof node.next === 'string') {
            verbose && console.log(LOG_PREFIX + 'view(lazily initiated): ' + node.next);
            matched = true;
            require([node.next], function(fn) {
              fn(resolved.params);
            });
          } else if (Array.isArray(node.next)) {
            verbose && console.log(LOG_PREFIX + 'array of config.urls: ' + JSON.stringify(node.next));
            matched = function(cb) {
              loop(node.next.map(function(url) {
                return {urlpath: resolved.remainder, node: url, params: resolved.params};
              }), cb);
            };
          } else if (node.next.conf === 'include') {
            verbose && console.log(LOG_PREFIX + 'segment matched -- include(lazily initiated): ' + node.next.path);
            matched = function(cb) {
              require([node.next.path], function(urls) {
                loop(urls.map(function(url) {
                  return {
                    urlpath: resolved.remainder,
                    node: url,
                    params: _.extend(params, resolved.params)
                  };
                }), cb);
              });
            };
          } else {
            console.error(LOG_PREFIX + 'Unhandled condition.');
          }
        } else {
          verbose && console.log(LOG_PREFIX + 'does not match this segement: ' + urlpath);
        }

        return matched;
      }

      function loop(queue, cb) {
        var args, matched;

        while (queue.length) {
          args = queue.shift();
          matched = visit(args.urlpath, args.node, args.params);
          if (matched === true) {
            // matches only the first one: done!
            verbose && console.log(LOG_PREFIX + 'loop: ' + args.urlpath + ' matched: ' + matched);
            cb(true);
            return true;
          } else if (matched === false) {
            continue;
          }

          // wait for callback
          verbose && console.log(LOG_PREFIX + 'wait on: ' + args.urlpath);
          matched(function(found) {
            if (found) {
              verbose && console.log(LOG_PREFIX + 'tail of the loop: ' + JSON.stringify(arguments));
              cb(true);
            } else {
              loop(queue, cb);
            }
          });
          return;
        }
        cb(false);
        return false;
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
        create: create
      };
    }
);
