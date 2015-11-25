define(
    ['require', 'module', 'storeys/template/response', 'storeys/resources/css', 'storeys/utils/promise'],
    function(require, module, response, css, Q) {
      var TemplateResponse = response.TemplateResponse;

      // -------------------------------------------
      //                 Utilities
      // -------------------------------------------
      function extend(a, b) {
        Object.keys(b).some(function(key) {
          a[key] = b[key];
        });
        return a;
      }

      // ===========================================
      //                   Public
      // ===========================================
      return {
        TemplateView: {
          as_view: function(config) {
            var templatepath = config.templatepath,
                context = config.context,
                document = config.document;

            return function(req, params, res) {
              css.load(config.csspaths)
                .then(function() {
                  var template = TemplateResponse(templatepath, context);

                  template(req, params, function(response) {
                    if ('status' in response && response.status === 200) {
                      if (document) {
                        window.document.write(response.content);
                        window.document.close();
                      } else {
                        window.document.body.innerHTML = response.content;
                      }
                      res({
                        status: 204,
                        content: response.content
                      });
                    } else {
                      res(response);
                    }
                  });
                });
            }
          }
        }
      };
    }
);
