define(
    ['require', 'module', 'settings'],
    function(require, module, settings) {
      var REDIRECT_FIELD_NAME = 'next';

      function login_required(f) {
        return function (req, params, res) {
          var location;

          if (!req.user) {
            location = (settings.LOGIN_URL + '?' +
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
