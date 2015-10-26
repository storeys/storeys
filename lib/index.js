define(
  ['require', 'module', 'settings', './core/handlers/base', './utils/binds'],
  function(require, module, settings, handlers, binds) {
    var LOG_PREFIX = '[storeys] ';

    var bind = binds.bind(),  // to support `on`, `off`, and `trigger`.
        verbose;

    function statepopped(event) {
      verbose && console.log(LOG_PREFIX + 'popstate(' + JSON.stringify(event.state) + ')');

      if (event.state) {
        console.error('Not Implemented');
      } else {
        go(settings.DEFAULT_URL || '');
      }
    }

    function go(href) {
      verbose && console.log(LOG_PREFIX + 'go to url(' + href + ')');

      handlers.get_response(href, function(response) {
        if (response !== false && typeof response !== 'undefined') {
          if ('status' in response) {
            verbose && console.log(LOG_PREFIX + 'dispatch: '+ href);
            if (response.status === 204) {
              verbose && console.log(LOG_PREFIX + 'HTTP 204 No Content (or rendered): '+ href);
            } else if (response.status === 200) {
              verbose && console.log(LOG_PREFIX + 'HTTP 200 Okay: '+ href);
              window.document.body.innerHTML = response.content;
            } else if (response.status === 301 || response.status === 302) {
              go(response.location);
            }
          } else {
            // @TODO --
            console.error('No handlers for this response. ' + JSON.stringify(response));
          }
        } else {
          console.error('Empty response for href: ' + href);
        }
      });
    }

    function clicked(e) {
      var $el = $(e.target),
          $a = $el.closest('a'),
          target = $a.attr("target"),
          hash = $a.prop("hash"),
          href = $a.attr("href");

      if (href) {
        go(href);
      }
    }

    function start() {
      handlers.on('started', function() {
        statepopped({state: history.state});

        window.addEventListener('popstate', statepopped);

        window.document.body.addEventListener('click', clicked);

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
