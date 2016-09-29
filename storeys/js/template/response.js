define(
    ['./loader', 'storeys/utils/promise', 'storeys/utils/objectlib'],
    function(loader, Q, objectlib) {
      // -------------------------------------------
      //                  Private
      // -------------------------------------------
      function render(templatepath, context, cb) {
        var promise = new Q(),
            template;

        template = loader.get_template(templatepath);
        template.render(context, function(err, dom) {
          if (!err) {
            promise.resolve({
              status: 200,
              content: dom
            });
          } else {
            promise.resolve({
              status: 500,
              message: err
            });
          }
        });

        return promise;
      }

      function get_context(req, params) {
        return objectlib.extend({request: req}, params);
      }

      // ===========================================
      //                   Public
      // ===========================================
      function TemplateResponse(templatepath) {
        return function(req, params) {
          var context = get_context(req, params);

          return render(templatepath, context);
        };
      }

      return {TemplateResponse: TemplateResponse};
    }
);
