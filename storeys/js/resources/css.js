define(
    ['require', '../utils/promise'],
    function(require, Q) {
      var resources = {};

      function process_app_path(urlstring) {
        var base = require.toUrl(''),
            urlpath = urlstring.indexOf('/') === 0 ? urlstring.substring(1) : urlstring;

        return base + urlpath;
      }

      function loadone(url, promise) {
        var link, img;

        link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);

        // detecting css is being loaded as a file
        img = document.createElement('img');
        img.src = url;
        img.onerror = function() {
          promise.resolve(link);
        }
      }

      function load(urls) {
        var all = [], one,
            url, i, len;

        if (!urls) {
          urls = [];
        } else if (!Array.isArray(urls)) {
          urls = [urls];
        }

        for (i=0, len=urls.length; i<len; i++) {
          url = process_app_path(urls[i]);
          if (url in resources === false) {
            one = new Q();
            resources[url] = one;
            loadone(url, one);
          } else {
            one = resources[url];
          }
          all.push(one);
        }

        return Q.all(all);
      }

      return {
        load: load
      }
    }
);
