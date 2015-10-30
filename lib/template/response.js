define(
    ['./loader'],
    function(loader) {
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
      function TemplateResponse(templatepath) {
        return function(req, params, res) {
          var template = loader.get_template(templatepath);

          template.render(extend({request: req}, params), function(err, dom) {
            if (!err) {
              res({
                status: 200,
                content: dom
              });
            } else {
              res({
                status: 500,
                message: err
              });
            }
          });
        };
      }

      return {TemplateResponse: TemplateResponse};
    }
);
