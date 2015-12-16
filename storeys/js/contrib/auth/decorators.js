define(
    ['require', 'module', 'settings'],
    function(require, module, settings) {
      var REDIRECT_FIELD_NAME = 'next';

      function login_required(f) {
        return function (req, params, res) {
          var location,
              args;

          if (!req.user) {
            location = (settings.URL_LOGIN + '?' +
              REDIRECT_FIELD_NAME + '=' + encodeURIComponent(req.path)
            );
            res({
              'location': location,
              'status': 301,
              'Cache-Control': 'no-cache'
            });
          } else if (req.user.active !== true) {
            location = (settings.URL_PENDING_ACTIVATION + '?' +
              REDIRECT_FIELD_NAME + '=' + encodeURIComponent(req.path)
            );
            res({
              'location': location,
              'status': 301,
              'Cache-Control': 'no-cache'
            });
          } else {
            if (typeof f === 'string') {
              args = Array.prototype.slice.apply(arguments);
              require([f], function(view) {
                if (typeof view === 'function') {
                  return view.apply(view, args);
                } else if ('dispatch' in view) {
                  return view.dispatch.apply(view, args);
                } else {
                  console.error('Error. Expected view object type.');
                }
              });
            } else {
              return f.apply(f, arguments);
            }
          }
        }
      }

      return {
        login_required: login_required
      };
    }
);
