define(
    ['require'],
    function(require) {
      var prefix = require.toUrl('');

      function TemplateTag() {
        this.tags = ['load', 'static', 'url'];

        this.parse = function(parser, nodes, lexer) {
          var tok = parser.nextToken(),
              args = parser.parseSignature(null, true),
              task = tok.value;

          parser.advanceAfterBlockEnd(tok.value);

          return new nodes.CallExtension(this, task, args);
        };

        this.load = function(context, args) {
          // template has no failure mode, just log an error
          console.error('Template tag, `load` is not supported. Value: ' + args);
        };

        this.static = function(context, args) {
          return prefix + args;
        };

        this.url = function(context, args) {
          // template has no failure mode, just log an error
          console.error('Template tag, `url` is not supported. Value: ' + args);
        };
      }

      return new TemplateTag();
    }
);
