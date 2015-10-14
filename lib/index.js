define(
  ['require', 'module', './core/urlresolver'],
  function(require, module, urlresolver) {
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
      }
    }

    function go(href) {
      verbose && console.log(LOG_PREFIX + 'go to url(' + href + ')');
      resolve(href);
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

      statepopped({state: history.state});

      window.addEventListener('popstate', statepopped);

      window.document.body.addEventListener('click', clicked);

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
