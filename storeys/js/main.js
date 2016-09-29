
define(['module'], function(module) {
  var uri = module.uri,
      instance = {};

  var req = require.config({
    config: {
      'storeys/index': {
        verbose: false
      },
      'storeys/template/loader': {
        verbose: false
      },
      'storeys/core/urlresolver': {
        verbose: true
      },
      'storeys/core/handlers/base': {
        verbose: false
      },
    },
    packages: [
      {
        name: 'storeys',
        location: (uri.substring(0, uri.lastIndexOf('/')) || '.'),
        main: 'index'
      },
      {
        name: 'slib',
        location: (uri.substring(0, uri.lastIndexOf('/')) || '.') + '/../lib'
      }
    ],
    shim: {
      'slib/nunjucks': {
        exports: 'nunjucks'
      },
      'slib/xregexp': {
        exports: 'XRegExp'
      },
      'slib/zousan': {
        exports: 'Zousan'
      },
    }
  });

  req(['storeys'], function(storeys) {
    storeys.start();
  });

  return instance;
});
