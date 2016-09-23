define(
    [],
    function() {
        // encoding a query string (RFC 3986)
        function encodeRFC3986URIComponent (str) {
          return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16);
          });
        }

        return {
          encodeRFC3986URIComponent: encodeRFC3986URIComponent
        }
    }
);
