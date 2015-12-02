define(
    ['./pathlib'],
    function(pathlib) {
      function parse(url) {
        // This function creates a new anchor element and uses location
        // properties (inherent) to get the desired URL data. Some String
        // operations are used (to normalize results across browsers).
        // Credit: http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
        var a =  document.createElement('a');
        a.href = url;
        return {
          source: url,
          protocol: a.protocol.replace(':',''),
          host: a.hostname,
          port: a.port,
          query: a.search,
          params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
              if (!seg[i]) { continue; }
              s = seg[i].split('=');
              ret[s[0]] = s[1];
            }
            return ret;
          })(),
          file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
          hash: a.hash.replace('#',''),
          path: a.pathname.replace(/^([^\/])/,'/$1'),
          relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
          segments: a.pathname.replace(/^\//,'').split('/')
        };
      }

      function relative(from, to) {
        var base = parse(from),
            absolute = parse(to);

        if (base.protocol === absolute.protocol) {
          delete absolute.protocol;

          if (base.host === absolute.host) {
            delete absolute.host;

            if (base.port === absolute.port) {
              delete absolute.port;

              if (base.path === absolute.path) {
                delete absolute.path;

                if (base.query === absolute.query) {
                  delete absolute.query;

                  if (base.hash === absolute.hash) {
                    delete absolute.hash;
                  }
                }
              } else {
                absolute.path = pathlib.relative(base.path, absolute.path);
              }
            }
          }
        }

        return join(absolute);
      }

      function join(parts) {
        var url = '';

        if (parts.protocol) {
          url = parts.protocol + ':';
        }

        if (parts.host) {
          url += '//' + parts.host;
        }

        if (parts.port !== null && typeof parts.port !== 'undefined' && parts.port !== '') {
          url += ':' + parts.port;
        }

        if (parts.path && parts.path !== '/') {
          url += parts.path;
        }

        if (parts.query) {
          if (parts.query.indexOf('?') !== 0) {
            url += '?';
          }
          url += parts.query;
        }

        if (parts.hash) {
          if (parts.hash.indexOf('#') !== 0) {
            url += '#';
          }
          url += parts.hash;
        }
        return url;
      }

      return {
        relative: relative,
        parse: parse,
        join: join
      }
    }
);
