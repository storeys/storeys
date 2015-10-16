define(
    ['require', 'module', 'nunjucks', 'settings'],
    function(require, module, nunjucks, settings) {
      var prefix = settings.STATIC_ROOT,
          loader = new nunjucks.WebLoader(prefix),
          env;

      loader.async = true;
      loader.getSource = function(name, callback) {
        var url = prefix + name;
        $.ajax({
          cache: true,
          url: url,
          success: function(data) {
            callback(null, {src: data, path: url, eagerCompile: true});
          },
          error: function(err) {
            callback('ajax error');
          }
        });
      };
      env = new nunjucks.Environment(loader);

      function templateresponse(templatepath, context) {
        return function(request, response) {
          env.render(templatepath, context, function(err, dom) {
            if (!err) {
              response(dom);
            } else {
              console.error('error rendering: ' + templatepath + ' error: ' + JSON.stringify(err));
            }
          });
        };
      }

      return {TemplateResponse: templateresponse};
    }
);
