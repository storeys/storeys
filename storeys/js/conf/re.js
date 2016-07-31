/**
 * A purpose-built and far-from-perfect implementation of extended RegEx that
 * enables Python-style named capture group.
 */
define(['xregexp'], function(XRegExp) {
  var PARAM_PATTERN = /\([\w-?<>"^\(\)\|\[\]\{\}@\\+,;:.*]{1,}\)/g,
      NAMED_PARAM_PATTERN = /\?P<[\w\$]{1,}>/;

  /**
   * Matches the specific (extended) regex against a string.
   *
   * @param regex a string representation of regex
   * @param names an array of the parameters names
   * @param string to match against
   * @returns {remainder: value, params: values} if matches, false otherwise
   */

  function exec(obj, regex, string) {
    var matches = string.match(regex) || false,
        captureNames = XRegExp(obj.source).xregexp.captureNames;
        remainder  = matches? string.replace(regex, ''): '',
        params = {},
        result = false;
        
    if (matches) {
        matches.slice(1).some(function (match, n) {
        if(captureNames){
            if(captureNames[n]){
                params[captureNames[n]] = match;
            }
        } else {
            params[n] = match;
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
        kwargs = [],
        regexps = [],
        source, tokens, match_key_regex;

    if (regexOrStr instanceof RegExp === false) {
      source = regexOrStr;
      tokens = source.match(PARAM_PATTERN) || [];
      tokens.some(function(token, n) {
        match_key_regex = token.match(NAMED_PARAM_PATTERN);
        if (match_key_regex) {
          kwargs.push(match_key_regex[0].substring(3, match_key_regex[0].length-1));
          regexps.push(token.replace(match_key_regex[0], ''));
          source = source.replace(match_key_regex[0], '');
        }
      });
      if(!match_key_regex){
          regexps = tokens;
      }
      regex = new RegExp(source);
    }
    if (regex.source === '' || endsWith(regex.source, '/$') || endsWith(regex.source, '/?$')) {
      // do nothing
    } else if (endsWith(regex.source, '$')) {
      regex = new RegExp(regex.source.slice(0, -1) + '/?$');
    }
    return {
      match: function(string) {
        return exec(this, regex, string);
      },
      toString: function() {
        return regex.toString();
      },
      toJSON: function() {
        return regex.toString();
      },
      kwargs: kwargs,
      tokens: regexps,
      source: regexOrStr
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
