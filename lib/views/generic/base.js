define(
    ['require', 'module', 'storeys/template/response'],
    function(require, module, response) {
      var TemplateResponse = response.TemplateResponse;

      return {TemplateView: {as_view: TemplateResponse}};
    }
);
