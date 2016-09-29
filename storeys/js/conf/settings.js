define(['module', 'storeys/utils/objectlib'], function(module, lib) {
  var defaults = {
        DEFAULT_URL: '',
        ROOT_URLCONF: '',
        MIDDLEWARE_CLASSES: [],
        PROJECT_APPS: []
      },
      config = module.config() || {},
      instance = {};

  return lib.extend(instance, defaults, config.settings);
});
