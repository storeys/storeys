define(
    ['require', 'module', 'storeys/template/response'],
    function(require, module, response) {
      function as_view(templatepath, script, context) {
        return function(req, res) {
          response.TemplateResponse(templatepath, script, context)(req, res);
        }
      }

      return {TemplateView: {as_view: as_view}};
    }
);
