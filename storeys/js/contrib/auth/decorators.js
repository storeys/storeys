define(
    ['require', 'module', 'storeys/conf/settings'],
    function(require, module, settings) {
      var REDIRECT_FIELD_NAME = 'next';

      function login_required(v) {
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
            if (typeof v === 'string') {
              args = Array.prototype.slice.apply(arguments);
              require([v], function(view) {
                if (typeof view === 'function') {
                  return view.apply(view, args);
                } else if ('dispatch' in view) {
                  view.dispatch.apply(view, args)
                      .then(res);
                } else {
                  console.error('Error. Expected view object type.');
                }
              });
            } else {
              if (typeof v === 'function') {
                return v.apply(v, arguments);
              } else if ('dispatch' in v) {
                v.dispatch.apply(v, arguments)
                    .then(res);
              } else {
                console.error('Error. Expected view object type.');
              }
            }
          }
        }
      }

      return {
        login_required: login_required
      };
    }
);
