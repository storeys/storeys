define(
    ['require', 'module', 'nunjucks', 'settings'],
    function(require, module, nunjucks, settings) {
      var env;

      function init() {
        var prefix = settings.STATIC_ROOT,
            loader = new nunjucks.WebLoader(prefix);

        loader.async = true;
        loader.getSource = function (name, callback) {
          var url = prefix + name;
          $.ajax({
            cache: true,
            url: url,
            success: function (data) {
              callback(null, {src: data, path: url, eagerCompile: true});
            },
            error: function (err) {
              callback('ajax error');
            }
          });
        };
        return new nunjucks.Environment(loader);
      }

      env = init();

      return {
        get_template: function(templatepath) {
          return {
            render: function(context, cb) {
              env.render(templatepath, context, cb);
            }
          }
        }
      }
    }
);
