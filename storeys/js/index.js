define(
  ['require', 'module', 'settings', './core/handlers/base', './utils/binds', './utils/urllib', './utils/pathlib'],
  function(require, module, settings, handlers, binds, urllib, pathlib) {
    var LOG_PREFIX = '[storeys] ',
        QURL = urllib.join(urllib.parse(settings.URL_ROOT)), /* qualified root url */
        UPDATE_URL = window.location.protocol !== 'file:';

    var bind = binds.bind(),  // to support `on`, `off`, and `trigger`.
        verbose;

    // -------------------------------------------
    //                 Utilities
    // -------------------------------------------
    function process_document_url(urlstring, context) {
      var path, url;

      if (urlstring.length === 0) {
        path = '';
      } else if (urlstring.charAt(0) === '/') {
        path = QURL + urlstring;
      } else {
        path = urlstring;
      }
      url = urllib.parse(path);
      context.path = url.path;
      context.GET  = url.params;
      context.hash = url.hash;
      return context;
    }

    /**
     *
     * @param urlstring, a relative url related to qualified `settings.ROOT_URL`
     * @param context
     * @returns {*}
     */
    function process_app_url(urlstring, context) {
      var url = urllib.parse(QURL + urlstring);

      context.path = url.path;
      context.GET  = url.params;
      context.hash = url.hash;
      return context;
    }

    // ===========================================
    //               Events Handling
    // ===========================================
    function statepopped(event) {
      verbose && console.log(LOG_PREFIX + 'popstate(' + JSON.stringify(event.state) + ')');

      var context;
      if (event.state) {
        context = process_app_url(event.state.path, {
          method: 'GET'
        });
        go(context, function(context) {
          window.document.body.classList.remove('loading');
        });
      } else {
        context = process_app_url(settings.DEFAULT_URL, {
          method: 'GET'
        });
        go(context, function(context) {
          var url;

          if (!window.history.state) {
            url = UPDATE_URL? context.path: '#' + context.path;
            window.history.replaceState({
              view: context.view,
              path: context.path
            }, '', url);
          }
          window.document.body.classList.remove('loading');
        });
      }
    }

    function go(context, cb) {
      verbose && console.log(LOG_PREFIX + 'go to path(' + context.path + ')');

      handlers.get_response(context, function(response) {
        var forward;

        if (response !== false && typeof response !== 'undefined') {
          if ('status' in response) {
            verbose && console.log(LOG_PREFIX + 'dispatch: '+ context.path);
            if (response.status === 204) {
              verbose && console.log(LOG_PREFIX + 'HTTP 204 - No Content (or rendered): '+ context.path);
              cb(context);
            } else if (response.status === 200) {
              verbose && console.log(LOG_PREFIX + 'HTTP 200 - Okay: '+ context.path);
              window.document.body.innerHTML = response.content;
              cb(context);
            } else if (response.status === 301 || response.status === 302) {
              forward = process_app_url(response.location, {
                method: 'GET'
              });
              go(forward, cb);
            } else if (response.status === 307) {
              forward = process_app_url(response.location, {
                method: reponse.method,
                POST: context.POST || []
              });
              go(forward, cb);
            } else if (response.status >= 500) {
              console.error(LOG_PREFIX + 'request \'' + context.path + '\' result in error: ' + response.status + '.');
              console.error(response.message);
              cb(context);
            }
          } else {
            // @TODO --
            console.error('No handlers for this response. ' + JSON.stringify(response));
            // cb(context);
          }
        } else {
          console.error('Empty response for path: ' + context.path);
          // cb(context);
        }
      });
    }

    function clicked(e) {
      var $el = $(e.target),
          $a = $el.closest('a'),
          hash = $a.prop('hash'),
          path = $a.attr('href') || '',
          req;

      if (path) {
        e.preventDefault();

        window.document.body.classList.add('loading');

        req = process_document_url(path, {method: 'GET'});
        go(req, function(context) {
          var state = window.history.state,
              url = UPDATE_URL? context.path: '#' + context.path;

          window.history.pushState({
            prev: state,
            view: context.view,
            path: context.path
          }, '', url);
          window.document.body.classList.remove('loading');
        });
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
        window.document.body.classList.add('loading');
        go(req, function(context) {
          var url = UPDATE_URL? context.path: '#' + context.path;

          window.history.pushState({
            view: context.view,
            path: context.path
          }, '', url);
          window.document.body.classList.remove('loading');
        });
      }

      return false;
    }

    function start() {
      handlers.on('started', function() {
        statepopped({state: history.state});

        window.addEventListener('popstate', statepopped);

        window.document.addEventListener('click', clicked);

        window.document.addEventListener('submit', submitted);

        bind.trigger('started');

        window.document.body.classList.remove('loading');

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
