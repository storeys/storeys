/**
 * A purpose-built and far-from-perfect implementation of extended RegEx that
 * enables Python-style named capture group.
 */
define([], function() {
  var PARAM_PATTERN = /\(.*?\)/g,
      NAMED_PARAM_PATTERN = /\(\?P<([a-zA-Z_\$][\w\$]*)>(.*?)\)/;

  /**
   * Matches the specific (extended) regex against a string.
   *
   * @param regex a string representation of regex
   * @param names an array of the parameters names
   * @param string to match against
   * @returns {remainder: value, params: values} if matches, false otherwise
   */
  function exec(regex, names, string) {
    var matches = string.match(regex) || false,
        remainder  = matches? string.replace(regex, ''): '',
        params = {},
        result = false;

    if (matches) {
      // fill the params, if any
      matches.slice(1).some(function (match, n) {
        params[n] = match;
        if (n in names) {
          params[names[n]] = match;
        }
      });

      result = {remainder: remainder, params: params};
    }

    return result;
  }

  // ------------------------------------------
  //                Utilities
  // ------------------------------------------
  function endsWith(str, suffix) {
    return str.slice(-suffix.length) == suffix;
  }

  // ===========================================
  //                 Public
  // ===========================================
  function compile(regexOrStr) {
    var regex = regexOrStr,
        names = [],
        source, tokens, match_key_regex;

    if (regexOrStr instanceof RegExp === false) {
      source = regexOrStr;
      tokens = source.match(PARAM_PATTERN) || [];
      tokens.some(function(token, n) {
        match_key_regex = token.match(NAMED_PARAM_PATTERN);
        if (match_key_regex) {
          names.push(match_key_regex[1]);
          source = source.replace(token, '(' + match_key_regex[2] + ')');
        }
      });
      regex = new RegExp(source);
    }
    if (regex.source === '' || endsWith(regex.source, '/$') || endsWith(regex.source, '/?$')) {
      // do nothing
    } else if (endsWith(regex.source, '$')) {
      regex = new RegExp(regex.source.slice(0, -1) + '/?$');
    }
    return {
      match: function(string) {
        return exec(regex, [], string);
      },
      toString: function() {
        return regex.toString();
      },
      toJSON: function() {
        return regex.toString();
      }
    };
  }

  function match(pattern, string) {
    return compile(pattern).match(string);
  }

  return {
    compile: compile,
    match: match
  }
});
