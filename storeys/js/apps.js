define(
    ['settings'],
    function(settings) {
      function get_app_configs() {
        var names = settings.PROJECT_APPS || [],
            configs = [],
            name, i, len;

        if (typeof names === 'string' || names instanceof String) {
          names = [names];
        }
        for (i=0, len=names.length; i<len; i++) {
          name = names[i];
          configs.push({name: name, path: name});
        }
        return configs;
      }

      return {
        get_app_configs: get_app_configs
      }
    }
);
