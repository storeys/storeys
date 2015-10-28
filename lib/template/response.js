define(
    ['./loader'],
    function(loader) {
      function TemplateResponse(templatepath, context) {
        return function(req, res) {
          var template = loader.get_template(templatepath);

          template.render(context, function(err, dom) {
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
