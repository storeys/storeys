define(
  ['require', 'module', 'settings', './core/handlers/base', './utils/binds', './utils/urllib', './utils/pathlib'],
  function(require, module, settings, handlers, binds, urllib, pathlib) {
    var LOG_PREFIX = '[storeys] ';

    var bind = binds.bind(),  // to support `on`, `off`, and `trigger`.
        verbose;

    // -------------------------------------------
    //                 Utilities
    // -------------------------------------------
    function extend(a, b) {
      Object.keys(b).some(function(key) {
        a[key] = b[key];
      });
      return a;
    }

    function clone(b) {
      var a = {};
      Object.keys(b).some(function(key) {
        a[key] = b[key];
      });
      return a;
    }

    function process_document_url(urlstring, context) {
      var base    = require.toUrl(''),
          baseurl = urllib.parse(base),
          path    = urlstring.indexOf('/') === 0? base + urlstring.substring(1): urlstring;
          url     = urllib.parse(path);

      context.path = urllib.relative(baseurl.path, url.path);
      context.GET  = url.params;
      return context;
    }

    function process_app_url(urlstring, context) {
      var base    = require.toUrl(''),
          baseurl = urllib.parse(base),
          path    = urlstring.indexOf('/') === 0? urlstring.substring(1): urlstring;
          url     = urllib.parse(base + path);

      context.path = urllib.relative(baseurl.path, url.path);
      context.GET  = url.params;
      return context;
    }

    // ===========================================
    //               Events Handling
    // ===========================================
    function statepopped(event) {
      verbose && console.log(LOG_PREFIX + 'popstate(' + JSON.stringify(event.state) + ')');

      var context;
      if (event.state) {
        console.error('Not Implemented');
      } else {
        context = process_app_url(settings.DEFAULT_URL || '', {
          method: 'GET',
        });
        go(context);
      }
    }

    function go(context) {
      verbose && console.log(LOG_PREFIX + 'go to path(' + context.path + ')');

      handlers.get_response(context, function(response) {
        var forward;

        if (response !== false && typeof response !== 'undefined') {
          if ('status' in response) {
            verbose && console.log(LOG_PREFIX + 'dispatch: '+ context.path);
            if (response.status === 204) {
              verbose && console.log(LOG_PREFIX + 'HTTP 204 - No Content (or rendered): '+ context.path);
            } else if (response.status === 200) {
              verbose && console.log(LOG_PREFIX + 'HTTP 200 - Okay: '+ context.path);
              window.document.body.innerHTML = response.content;
            } else if (response.status === 301 || response.status === 302) {
              forward = process_app_url(response.location, {
                method: 'GET'
              });
              go(forward);
            } else if (response.status === 307) {
              forward = process_app_url(response.location, {
                method: reponse.method,
                POST: context.POST || []
              });
              go(forward);
            }
          } else {
            // @TODO --
            console.error('No handlers for this response. ' + JSON.stringify(response));
          }
        } else {
          console.error('Empty response for path: ' + context.path);
        }
      });
    }

    function clicked(e) {
      var $el = $(e.target),
          $a = $el.closest('a'),
          hash = $a.prop('hash'),
          path = $a.attr('href'),
          req;

      if (path) {
        e.preventDefault();

        req = process_document_url(path, {method: 'GET'});
        go(req);
      }
    }

    function submitted(e) {
      var $el     = $(e.target),
          $form   = $el.closest('form'),
          path    = $form.attr('action'),
          method  = $form.attr('method'),
          req;

      if (path) {
        e.preventDefault();

        req = process_document_url(path, {
          method: method || 'POST',
          POST: $form.serializeArray()
        });
        go(req);
      }

      return false;
    }

    function start() {
      handlers.on('started', function() {
        statepopped({state: history.state});

        window.addEventListener('popstate', statepopped);

        window.document.body.addEventListener('click', clicked);

        window.document.body.addEventListener('submit', submitted);

        bind.trigger('started');

        verbose && console.log(LOG_PREFIX + 'storeys started.');
      });
    }

    function init(config) {
      config  = config || {};
      verbose = config.verbose || false;

      if (document.readyState !== 'complete') {
        window.addEventListener('load', start);
      } else {
        start(config);
      }
    }

    init(module.config() || {});

    return {
      on: bind.on,
      off: bind.off
    };
  }
);
