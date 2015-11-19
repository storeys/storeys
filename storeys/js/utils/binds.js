define(
    [],
    function() {
      function bind(instance) {
        var binder = instance || {};
        var handlers = [];

        binder.on = binder.bind = function (type, fn) {
          var filter, handler;

          filter = typeof(type) === "string" ? {type: type} : type;
          handler = extend({fn: fn}, filter);
          handlers.push(handler);

          return binder;
        };

        binder.off = binder.unbind = function (type, fn) {
          var filter;

          filter = typeof(type) === "string" ? {type: type} : type;
          filter = fn === undefined ? filter : extend({fn: fn}, filter);
          remove(handlers, filter);

          return binder;
        };

        binder.trigger = function (type, params, summary) {
          var j, count = 0, len,
              args = [{type: type}],
              filter = typeof(type) === "string" ? {type: type} : type,
              matches = find(handlers, filter),
              wildcards = find(handlers, {type: '*'}),
              items = [].concat(matches).concat(wildcards);

          // normalize args
          if (typeof params !== 'undefined' && params !== null) {
            if (typeof params === 'string' || typeof params === 'number') {
              args.push(params);
            } else if ('length' in params) { // array
              Array.prototype.push.apply(args, params);
            }
          }

          // callback all
          for (j = 0, len = items.length; j < len; j++) {
            count++;
            ret = items[j].fn.apply(this, args);
            if (ret === false) {
              break;
            }
          }
          summary && $.isFunction(summary) && summary(count);

          return binder;
        };

        return binder;
      }

      // -------------------------------------------
      //                 Utilities
      // -------------------------------------------
      function extend(a, b) {
        Object.keys(b).some(function(key) {
          a[key] = b[key];
        });
        return a;
      }

      function match(entry, filters) {
        var result = false,
            matchAll, matchSome,
            key;

        if (typeof filters !== 'function') {
          matchAll = true;
          matchSome = false;
          for (key in filters) {
            if (typeof entry === 'undefined') {
              // problematic
              matchAll = false;
              break;
            } else if (filters[key] !== entry[key]) {
              matchAll = false;
              break;
            }
            matchSome = true; // make sure filter is non-empty
          }
          result = matchSome && matchAll;
        } else {
          result = filters(entry);
        }
        return result;
      }

      function find(array, filters) {
        var result = [];
        for (var i=0, len=array.length; i<len; i++) {
          var item = array[i];
          if (match(item, filters)) {
            result.push(item);
          }
        }
        return result;
      }

      function remove(array, filter) {
        var result = [];
        for (var i=(array.length - 1); i>=0; i--) {
          var item = array[i];
          if (Matches.match(item, filter)) {
            result.push(item);
            array.splice(i, 1);
          }
        }
        return result.reverse();
      }

      return {
        bind: bind
      }
    }
);
