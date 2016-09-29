define([], function() {
  function extend(a, b) {
    Array.prototype.slice.call(arguments, 1).some(function(b) {
      Object.keys(b).some(function(key) {
        a[key] = b[key];
      });
    });
    return a;
  }

  return {
    extend: extend
  };
});
