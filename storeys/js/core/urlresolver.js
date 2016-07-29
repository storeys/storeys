define(
    ['require', 'jquery', 'settings', 'module', 'storeys/conf/urls', 'storeys/utils/http'],
    function(require, $, settings, module, urls, http) {
      var LOG_PREFIX = '[storeys.core.urls] ',
          EMPTY_REG = /(?:)/,
          encodeRFC3986URIComponent = http.encodeRFC3986URIComponent;

      var verbose;

      function visit(urlpath, node, params, cb) {
        var resolved = node.regex.match(urlpath);
        if (resolved) {
          verbose && console.log(LOG_PREFIX + 'visit(' + urlpath + ') resolved: ' + resolved + ' with regex: ' + node.regex);
          if (typeof node.next === 'string') {
            verbose && console.log(LOG_PREFIX + 'resolved(lazily initiated): ' + node.next);
            require([node.next], function(fn) {
              cb(resolved.params, fn);
            });
          } else if (typeof node.next === 'function' || 'dispatch' in node.next) {
            verbose && console.log(LOG_PREFIX + 'resolved: ' + node.next);
            cb(resolved.params, node.next);
          } else if (Array.isArray(node.next)) {
            verbose && console.log(LOG_PREFIX + 'array of config.urls: ' + JSON.stringify(node.next));
            loop(node.next.map(function(url) {
              return {urlpath: resolved.remainder, node: url, params: resolved.params};
            }), cb);
          } else if (node.next.conf === 'include') {
            verbose && console.log(LOG_PREFIX + 'segment matched -- include(lazily initiated): ' + node.next.path);
            var path_to_routes = get_path_to_application_routes(node.next.path.split('/')[0]);
            require([path_to_routes], function(urls) {
              verbose && console.log(LOG_PREFIX + 'include(lazily initiated) loaded: ' + path_to_routes);
              loop(urls.map(function(url) {
                return {
                  urlpath: resolved.remainder,
                  node: url,
                  params: extend(params, resolved.params)
                };
              }), cb);
            });
          } else {
            console.error(LOG_PREFIX + 'Unhandled condition.');
          }
        } else {
          verbose && console.log(LOG_PREFIX + 'visit(' + urlpath + ') does not match this segment: `' + urlpath + '` with regex: ' + node.regex);
          cb(false);
        }
      }

      function loop(queue, cb) {
        var args;

        if (!queue.length) {
          return cb(false);
        }

        args = queue.shift();
        visit(args.urlpath, args.node, args.params, function(params, view) {
          if (params === false) {
            loop(queue, cb);
          } else {
            cb(params, view);
          }
        });
      }

      // -------------------------------------------
      //                 Reverse
      // -------------------------------------------

      function reverse(viewname, params, cb) {
          var named_patterns;

          if(params !== undefined)
              if(!Array.isArray(params) && !(typeof(params) === 'object'))
                  throw 'reverse() `params` should be type of `Object` or `Array`, `' + typeof(params) + '` received.';

          get_url_patterns(settings.ROOT_URLCONF, '/', {}, function(named_patterns){
            //   verbose && console.log(LOG_PREFIX + 'Named patterns: ' + JSON.stringify(named_patterns))
              patterns = named_patterns[viewname]
              for(var i in patterns){
                  if (!patterns.hasOwnProperty(i)) continue;

                  var resolved = false,
                      pattern = patterns[i];

                  if( (params === undefined ||
                      Object.getOwnPropertyNames(params).length == 0) &&
                      pattern.regex.tokens.length == 0){
                    cb(pattern_final_preparation(pattern.path)); return;

                  } else if (pattern.regex.tokens.length == Object.keys(params).length){
                      verbose && console.log(LOG_PREFIX + 'Url-pattern arguments: ' + JSON.stringify(pattern.regex.tokens))

                      if(Array.isArray(params)){
                        // Array (args) processing
                        verbose && console.log(LOG_PREFIX + 'Array (args) processing.')

                        if(pattern.regex.kwargs.length != 0)
                          continue;

                        // TODO: Very rare thing. Possibly, should be realized in next versions.
                        throw_if_nested_args(pattern.path);

                        for(var j in pattern.regex.tokens){
                            resolved = true;

                            if (!pattern.regex.tokens.hasOwnProperty(j)) continue;

                            var param_value = params[j].toString(),
                                param_regex = new RegExp("^"+pattern.regex.tokens[j]+"$", 'g'),
                                value_resolved = ((param_value.match(param_regex) || []).length == 1);

                            verbose && console.log(LOG_PREFIX + 'RegExp: ' + param_regex + ' || Match value: '+ param_value + ' || Result: ' + value_resolved)
                            if (!value_resolved){
                              resolved = false; break;
                            }

                            param_value = encodeRFC3986URIComponent(param_value);
                            pattern.path = pattern.path.replace(pattern.regex.tokens[j], param_value);
                        }

                      } else {
                        // JSON (kwargs) processing
                        verbose && console.log(LOG_PREFIX + 'JSON (kwargs) processing.')

                        if(pattern.regex.kwargs.length == 0)
                          continue;

                        for(var j in pattern.regex.tokens){
                          var resolved = true,
                              key = pattern.regex.kwargs[j];

                          if(!(key in params)){
                            resolved = false; break;
                          } else {
                              var param_value = params[key].toString(),
                                  param_regex = new RegExp("^" + pattern.regex.tokens[j].substring(1, pattern.regex.tokens[j].length-1) + "$", "g"),
                                  value_resolved = ((param_value.match(param_regex) || []).length == 1);

                              verbose && console.log(LOG_PREFIX + 'RegExp: ' + param_regex + ' || Match value: '+ param_value + ' || Result: ' + value_resolved)
                              if (!value_resolved){
                                resolved = false; break;
                              }

                              param_value = encodeRFC3986URIComponent(param_value)
                              pattern.path = pattern.path.replace(pattern.regex.tokens[j], param_value);
                          }
                        }
                      }
                  }
                  if (resolved){
                      pattern = pattern_final_preparation(pattern.path);
                      cb(pattern); return;
                  }
              }
              throw "Reverse for '"+viewname+"' with arguments '"+JSON.stringify(params)+"' not found. Pattern(s) tried: "+JSON.stringify(named_patterns)
          });
      }

      /**
      * Function search for url-patterns
      * from all available applications
      * and returns a json object of them
      */
      function get_url_patterns(viewname, base_url, patterns, cb){
        var included_paths = {}

        require(
        [viewname], function(urlspec) {
          var patterns = {};

          $.each(urlspec, function(key, value){
            if(value['next']['conf'] === "include" &&
               value['name'] !== undefined) {
                 throw '`url` with `include` functionality should have an `undefined` name arg';
            } else if (value['next']['conf'] === "include") {
              included_paths[value.regex.toString()] = value['next']['path'];
            } else if (value['name'] != undefined) {

              // Removing last '/' from base_url
              base_url = (base_url[base_url.length - 1] === '/') ? base_url.substring(0, base_url.length - 1) : base_url

              //TODO:  Fix JS behaviour: str.replace('\\/?','')
              value['path'] = base_url + value['regex'].toString().replace('\\/?','')

              patterns = update(patterns, {[value['name']]: value})
            }
          });

          if(Object.keys(included_paths).length != 0){
            $.each(included_paths, function(re, included_path){

              verbose && console.log(LOG_PREFIX + '`' + included_path + '` visited')

              get_url_patterns(
                  get_path_to_application_routes(included_path.split('/')[0]),
                  re,
                  {},
                  function(new_patterns){
                      patterns = update(
                        patterns,
                        new_patterns
                      )
                      cb(patterns)
                  }
               );
            })
          } else {
            cb(patterns)
          }
        });
      }

      // -------------------------------------------
      //                 Utilities
      // -------------------------------------------
      function extend(a, b) {
        Object.keys(b).some(function(key) {
          a[key] = b[key];
        });
        return a;
      }

      /**
      * Concatenate two objects
      * If key exist in both objects, values will be concatenated with uniquness
      */
      function update(obj1, obj2){
          for (var prop in obj2) {

              if (!obj2.hasOwnProperty(prop)) continue;

              if ( prop in obj1 && obj1[prop].length != 0 ){
                  obj1[prop] = concat_unique(obj1[prop], Array.isArray(obj2[prop]) ? obj2[prop] : [obj2[prop]])
              } else {
                  obj1[prop] = (Array.isArray(obj2[prop]) ? obj2[prop] : [obj2[prop]]) ;
              }
          }
          return obj1;
      }

      /**
      * Concat two array using unique values
      */
      function concat_unique(arr1, arr2) {
          for(var i=0; i<arr2.length; ++i) {
              var exists = false;
              for(var j=0; j<arr1.length; ++j) {
                  if(arr2[i] === arr1[j]){
                      exists = true;
                      break;
                  }
              }

              if (!exists)
                  arr1.push(arr2[i])
          }
          return arr1;
      };

      // TODO: implement code for patterns with nested arguments
      function throw_if_nested_args(pattern){
          if((pattern.match(/\?P/g) || []).length != 0)
            throw "Url-patterns with nested arguments doesn't supports at current version"
      }

      // Wecan't use .match() because JS doesn't supports P<name> in RegExp
      // In this function we are replacing all special 'regex' characters and working with last '/'
      function pattern_final_preparation(pattern){
          return pattern.replace(/([\^\\\\]|\$\/)/g,'').replace('//','/');
      }

      function get_path_to_application_routes(appname){
          return appname+'/static/'+appname+'/urls'
      }

      // ===========================================
      //                 Public
      // ===========================================
      function create(spec) {
        var root;

        if (Array.isArray(spec)) {
            root = urls.url(EMPTY_REG, spec);
        }

        return function(urlpath, cb) {
          loop([{urlpath: urlpath, node: root, params: {}}], cb || function(resolved) {
            verbose && console.log(LOG_PREFIX + 'resolve completed. match ' + (resolved? '': 'not ') + 'found');
          });
        };
      }

      // ===========================================
      //                  Init
      // ===========================================
      function init(config) {
        verbose = config.verbose || false;
      }

      init(module.config() || {});

      return {
        create: create,
        reverse: reverse,
      };
    }
);
