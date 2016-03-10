define(
    ['require', 'module', 'slib/nunjucks', 'storeys/apps', './defaulttags'],
    function(require, module, nunjucks, apps, defaulttags) {
      var LOG_PREFIX = '[storeys.template.loader] ';

      var verbose,
          env,
          prefix = require.toUrl(''),
          paths = {};

      function get_paths(name) {
        var segments = name.split('/'),
            results = [],
            bestguess, key;

        if (segments.length > 1) {
          bestguess = segments[0];
          if (bestguess && bestguess in paths) {
            results.push(paths[bestguess] + name);
          }
        }

        for (key in paths) {
          if (!bestguess || key !== bestguess) {
            results.push(paths[key] + name);
          }
        }

        return results;
      }

      function get_source(name, callback) {
        var url = get_paths(name)[0];

        verbose && console.log(LOG_PREFIX + 'loading(' + name + ') from: ' + url);
        $.ajax({
          cache: true,
          url: url,
          success: function (data) {
            callback(null, {src: data, path: url, eagerCompile: true});
          },
          error: function (err) {
            callback('ajax error: ' + err);
          }
        });
      }

      function init(config) {
        var loader = new nunjucks.WebLoader(prefix),
            i, len, app, appconfigs;

        verbose = config.verbose || false;

        loader.async = true;
        loader.getSource = get_source;

        env = new nunjucks.Environment(loader);
        env.addExtension('defaulttags', defaulttags);

        appconfigs = apps.get_app_configs();
        for (i=0, len=appconfigs.length; i<len; i++) {
          app = appconfigs[i];
          paths[app.name] = prefix + app.path + '/templates/';
        }

        return env;
      }

      // ===========================================
      //                  Init
      // ===========================================
      init(module.config() || {});

      return {
        get_template: function(templatepath) {
          return {
            render: function(context, cb) {
              env.render(templatepath, context, cb);
            }
          }
        }
      }
    }
);
