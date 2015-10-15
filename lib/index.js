define(
  ['require', 'module', './core/urlresolver', 'settings'],
  function(require, module, urlresolver, settings) {
    var LOG_PREFIX = '[storeys] ';

    var verbose,
        urlspec,
        resolve;

    function on() {
      throw 'Not Implemented'
    }

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
      resolve(href, function(params, view) {
        var found = params !== false;
        if (found) {
          view({
            url: href,
            params: params,
            set: function (value) {
              window.document.body.innerHTML = value;
            }
          });
        } else {
          verbose && console.log(LOG_PREFIX + 'found no match for url: ' + href);
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
      resolve = urlresolver.create(urlspec);

      setTimeout(function() {
        statepopped({state: history.state});

        window.addEventListener('popstate', statepopped);

        window.document.body.addEventListener('click', clicked);
      })

      verbose && console.log(LOG_PREFIX + 'storeys started.');
    }

    function init(config) {
      config  = config || {};
      verbose = config.verbose || false;

      require(
          [config.ROOT_URLCONF],
          function(spec) {
            verbose && console.log(LOG_PREFIX + 'loaded url spec(' + JSON.stringify(spec) + ')');
            urlspec = spec;
            if (document.readyState !== 'complete') {
              window.addEventListener('load', start);
            } else {
              start(config);
            }
          }
      );
    }

    init(module.config() || {});

    return {
      on: on
    };
  }
);
