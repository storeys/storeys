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

    function go(url) {
      verbose && console.log(LOG_PREFIX + 'go to url(' + url + ')');

      handlers.get_response(url, function(response) {
        // @TODO -- handle different kinds of response
        verbose && console.log(LOG_PREFIX + 'dispatch: '+ url);
        window.document.body.innerHTML = response;
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
