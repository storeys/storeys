define(
    ['require', 'module', 'storeys/template/response'],
    function(require, module, response) {
      function as_view(templatepath) {
        return function(res) {
          response.TemplateResponse(templatepath)(res);
        }
      }

      return {TemplateView: {as_view: as_view}};
    }
);
