define(
    ['require', 'module', 'settings'],
    function(require, module, settings) {
      var REDIRECT_FIELD_NAME = 'next';

      function login_required(f) {
        return function (req, params, res) {
          var location;

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
            return f.apply(f, arguments);
          }
        }
      }

      return {
        login_required: login_required
      };
    }
);
