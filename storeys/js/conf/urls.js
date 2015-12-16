define(
  ['./re'],
  function(re) {
    // ===========================================
    //                 Public
    // ===========================================
    function include(path) {
      return {
        conf: 'include',
        path: path,
        toString: function() {
          return 'include(' + path + ')';
        }
      };
    }

    function patterns(urls) {
      return {
        conf: 'patterns',
        urls: urls
      }
    }

    /**
     * Return a function that matches the specified url, with the following signature
     *    function(url, cb)
     * where,
     *    cb - is a callback function with the following signature
     *        function(fullpath, match)
     *
     * The function invokes the specified cb return true if it a match is found; return
     * false otherwise.
     *
     * @param regex a string representation of regex
     * @param vieworurls
     * @returns a function
     */
    function url(regex, vieworurls) {
      var compiled = re.compile(regex),
          next;

      if (!vieworurls) {
        throw 'Undefined `vieworurls`.';
      } else if (typeof vieworurls == 'string') {
          next = vieworurls;
      } else if (typeof vieworurls == 'function' || 'dispatch' in vieworurls) {
        next = vieworurls;
      } else if (Array.isArray(vieworurls)) {
        next = vieworurls;
      } else if (vieworurls.conf == 'include') {
        next = vieworurls;
      } else {
        throw 'Unexpected type: `vieworurls`.';
      }
      return {
        regex: compiled,
        next: next
      };
    }

    return {
      include: include,
      url: url
    };
  }
);
