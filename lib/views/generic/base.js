define(
    ['require', 'module', 'storeys/template/response'],
    function(require, module, response) {
      var TemplateResponse = response.TemplateResponse;

      return {
        TemplateView: {
          as_view: function(templatepath, context) {
            return function(req, res) {
              var template = TemplateResponse(templatepath, context);

              template(req, function(response) {
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
