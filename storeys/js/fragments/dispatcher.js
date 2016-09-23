define(
    ['require', 'module', 'settings', 'storeys/core/urlresolver', 'storeys/utils/promise'],
    function(require, module, settings, urlresolver, Q) {
      var LOG_PREFIX = '[storeys.fragments.dispatcher] ';

      var service,
          hashspec,
          resolve,
          verbose;

      // ===========================================
      //                  Public
      // ===========================================
      function dispatch(req, cb) {
        verbose && console.log(LOG_PREFIX + 'dispatch(' + req.hash + ') method: ' + req.method);

        var hash = req.hash.indexOf('#') === 0? req.hash.substring(1): req.hash;
        if (hash) {
          resolve(hash, function(params, fragment) {
            if (params !== false) {
              request = extend({}, req);
              if ('dispatch' in fragment) {
                fragment.dispatch(request, params).then(function(res) {
                  res.fragment = fragment;
                  cb(res);
                });
              } else {
                fragment(request, params, function(res) {
                  res.fragment = fragment;
                  cb(res);
                });
              }
            } else {
              verbose && console.warn(LOG_PREFIX + 'found no match for hash: ' + req.hash);
              cb(req);
            }
          });
        } else {
          verbose && console.warn(LOG_PREFIX + 'empty hash');
          cb(req);
        }
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
            [settings.ROOT_HASHCONF],
            function(spec) {
              verbose && console.log(LOG_PREFIX + 'loaded url spec(' + JSON.stringify(spec) + ')');
              hashspec = spec;
              resolve = urlresolver.create(hashspec);
              service.resolve();
            }
        );
      }

      init(module.config() || {});

      return {
        start: start,
        dispatch: dispatch
      }
    }
);
