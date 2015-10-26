define(
    ['require', 'module', 'nunjucks', 'settings'],
    function(require, module, nunjucks, settings, binds) {
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

      function TemplateResponse(templatepath, scripts, context) {
        scripts = !scripts || Array.isArray(scripts)? scripts: [scripts];
        var instance = function(request, response) {
          env.render(templatepath, context, function(err, dom) {
            if (!err) {
              instance.content(dom, function() {
                instance.script(function() {
                  response({
                    content: dom,
                    status: 209
                  });
                });
              });
            } else {
              console.error('error rendering: ' + templatepath + ' error: ' + JSON.stringify(err));
            }
          });
        };

        instance.content = function(content, cb) {
          window.document.body.innerHTML = content;
          cb();
        };

        instance.script = function(cb) {
          require(scripts, cb);
        };

        return instance;
      }

      return {TemplateResponse: TemplateResponse};
    }
);
