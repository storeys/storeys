define(
    ['require', 'module', 'storeys/template/response'],
    function(require, module, response) {
      function as_view(templatepath) {
        return function(req, res) {
          response.TemplateResponse(templatepath)(req, res);
        }
      }

      return {TemplateView: {as_view: as_view}};
    }
);
