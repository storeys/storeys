define(
    ['require', 'storeys/core/urlresolver'],
    function(require, urlresolver) {
      var prefix = require.toUrl('');

      function TemplateTag() {
        this.tags = ['load', 'static', 'url', 'csrf_token'];
        ASYNC_TAGS = ['url'];

        this.parse = function(parser, nodes, lexer) {
          var tok = parser.nextToken(),
              args = parser.parseSignature(null, true),
              task = tok.value;

          parser.advanceAfterBlockEnd(tok.value);

          // If our task is async -> CallExtensionAsync
          if(ASYNC_TAGS.indexOf(task) > -1)
            return new nodes.CallExtensionAsync(this, task, args);
          else
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

        this.csrf_token = function(context, args) {
          // template has no failure mode, just log an error
          console.error('Template tag, `csrf_token` is not supported. Value: ' + args);
        };

        this.url = function(context) {
            var arg_length = arguments.length,
                cb = arguments[arg_length-1],
                url_name = arguments[1],
                args = [],
                named_arguments = ((typeof arguments[arg_length-2]) == 'object') ? arguments[arg_length-2] : false

            if(typeof url_name != 'string')
                throw '{% url `url-name` %} Url-name should be a string value';
            if(arg_length > 4 && named_arguments)
                throw 'Templatetag `url` doesn\'t supports united arguments. Please user only arguments or only named arguments.';


            if(named_arguments){
                args = named_arguments;
                delete args.__keywords;
            } else {
                for(i=2; i<arg_length-1; i++){
                    args.push(arguments[i]);
                }
            }

            urlresolver.reverse(url_name, args, function(url){
                cb('', url);
            });
        };
      }

      return new TemplateTag();
    }
);
