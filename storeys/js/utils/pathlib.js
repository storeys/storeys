define(
    ['require'],
    function(require) {
      var BASE = require.toUrl('');

      function relative(base, dest) {
        // Credit: partially inspired by nodejs's path.relative() method
        var from = base.split('/'),
            to = dest.split('/'),
            segment = [],
            cutpos = 0,
            i, len, result;

        for (i = 0, len = cutpos = Math.min(from.length, to.length); i < len; i++) {
          if (from[i] !== to[i]) {
            cutpos = i;
            break;
          }
        }

        for (i = cutpos, len = from.length; i < len; i++) {
          if (i !== cutpos || from[i] !== '') {
            segment.push('..');
          }
        }

        segment = segment.concat(to.slice(cutpos));
        result = segment.join('/');

        return result;
      }

      /**
       * Dissolve the specified path into a relative path of the base url.
       *
       * If the path is absolute, a leading slash will be removed.
       *
       * @param path
       * @returns {*}
       */
      function dissolve(path) {
        if (path.indexOf('/') === 0) {
          path = path.substring(1);
        } else if (path.indexOf('./') === 0) {
          path = path.substring(2);
        } else {
          path = relative(BASE, path);
        }
        return path;
      }

      return {
        relative: relative,
        dissolve: dissolve
      }
    }
);
