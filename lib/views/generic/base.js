define(
    ['require', 'module', 'storeys/template/response'],
    function(require, module, response) {
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
          as_view: function(templatepath, context) {
            return function(req, params, res) {
              var template = TemplateResponse(templatepath, context);

              template(extend({request: req}, params), function(response) {
                if ('status' in response && response.status === 200) {
                  window.document.body.innerHTML = response.content;
                  res({
                    status: 204,
                    content: response.content
                  });
                } else {
                  res(response);
                }
              });
            }
          }
        }
      };
    }
);
