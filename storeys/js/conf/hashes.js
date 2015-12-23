define(
    ['./urls'],
    function(urls) {
      return {
        include: urls.include,
        hash: urls.url
      };
    }
);
