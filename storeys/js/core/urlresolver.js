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
            require([node.next.path], function(urls) {
              verbose && console.log(LOG_PREFIX + 'include(lazily initiated) loaded: ' + node.next.path);
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
          var named_patterns,
              regex_django_params = /\([a-zA-Z0-9-_?<>"^\(\)\|\[\]\{\}@\\+,;:.*]{1,}\)/g,
              regex_django_params_kw = /\\\?P<[a-zA-Z0-9_]{1,}>/;

          if(params !== undefined)
              if(!Array.isArray(params) && !(typeof(params) === 'object'))
                  throw 'reverse() `params` should be type of `Object` or `Array`, `' + typeof(params) + '` received.';

          get_url_patterns(settings.ROOT_URLCONF, '/', {}, function(named_patterns){
              verbose && console.log(LOG_PREFIX + 'Named patterns: ' + JSON.stringify(named_patterns))
              patterns = named_patterns[viewname]

              for(var i in patterns){
                  var matched = false;

                  if (!patterns.hasOwnProperty(i)) continue;

                  var pattern = patterns[i],
                      res = pattern.match(regex_django_params) || [];

                  if( (params === undefined ||
                      Object.getOwnPropertyNames(params).length == 0) &&
                      res.length == 0){
                    cb(pattern_final_preparation(pattern)); return;

                  } else if (res.length == Object.keys(params).length){
                      verbose && console.log(LOG_PREFIX + 'Url-pattern arguments: ' + JSON.stringify(res))

                      if(Array.isArray(params)){
                        // Array (args) processing
                        verbose && console.log(LOG_PREFIX + 'Array (args) processing.')

                        if((pattern.match(/\?P/g) || []).length != 0)
                          continue;

                        // TODO: Very rare thing. Possibly, should be realized in next versions.
                        throw_if_nested_args(pattern);

                        for(var j in res){
                            matched = true;

                            if (!res.hasOwnProperty(j)) continue;

                            var param_value = params[j].toString(),
                                param_regex = new RegExp("^"+res[j]+"$", 'g'),
                                value_matched = ((param_value.match(param_regex) || []).length == 1);

                            verbose && console.log(LOG_PREFIX + 'RegExp: ' + param_regex + ' || Match value: '+ param_value + ' || Result: ' + value_matched)
                            if (!value_matched){
                              matched = false; break;
                            }

                            param_value = encodeRFC3986URIComponent(param_value);
                            pattern = pattern.replace(res[j], param_value);
                        }

                      } else {
                        // JSON (kwargs) processing
                        verbose && console.log(LOG_PREFIX + 'JSON (kwargs) processing.')

                        if((pattern.match(/\?P</g) || []).length == 0)
                          continue;

                        for(var j in res){
                          matched = true;

                          if (!res.hasOwnProperty(j)) continue;

                          var param = res[j].match(regex_django_params_kw)[0],
                              key = param.replace(/[\\?P<>]/g, '');

                          if(!(key in params)){
                            matched = false; break;
                          } else {
                              var param_value = params[key].toString(),
                                  param_regex = new RegExp("^" + res[j].substring(1, res[j].length-1).replace(param,'') + "$", "g"),
                                  value_matched = ((param_value.match(param_regex) || []).length == 1);

                              verbose && console.log(LOG_PREFIX + 'RegExp: ' + param_regex + ' || Match value: '+ param_value + ' || Result: ' + value_matched)
                              if (!value_matched){
                                matched = false; break;
                              }

                              param_value = encodeRFC3986URIComponent(param_value)
                              pattern = pattern.replace(res[j], param_value);
                          }
                        }
                      }
                  }
                  if (matched){
                      pattern = pattern_final_preparation(pattern);
                      cb(pattern); return;
                  }
              }
              throw "Reverse for '"+viewname+"' with arguments '"+JSON.stringify(params)+"' not found. Pattern(s) tried: "+JSON.stringify(named_patterns)
          })
      }

      /**
      * Function search for url-patterns
      * from all available applications
      * and returns a json of them
      */
      function get_url_patterns(viewname, base_url, patterns, cb){
        var included_paths = {}

        require(
        [viewname, 'storeys/utils/datastructures'], function(urlspec, datastructures) {
          var patterns = new datastructures.MultiValueDict();

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
              path = base_url + value['regex'].toString().replace('\\/?','')

              patterns.update({[value['name']]: path})
            }
          });

          if(Object.keys(included_paths).length != 0){
            $.each(included_paths, function(re, included_path){

              verbose && console.log(LOG_PREFIX + '`' + included_path + '` visited')

              get_url_patterns(
                  get_path_to_application_routes(included_path.split('/')[0]),
                  re,
                  new datastructures.MultiValueDict(),
                  function(new_patterns){
                      patterns.update(
                        new_patterns
                      )
                      cb(patterns)
              });

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
          loop([{urlpath: urlpath, node: root, params: {}}], cb || function(matched) {
            verbose && console.log(LOG_PREFIX + 'resolve completed. match ' + (matched? '': 'not ') + 'found');
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
