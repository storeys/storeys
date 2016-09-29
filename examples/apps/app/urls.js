define(
    ['storeys/conf/urls', 'storeys/views/generic/base'],
    function(urls, base) {
      var url = urls.url,
          include = urls.include,
          TemplateView = base.TemplateView;

      return [
        url('^/',
          new TemplateView({
            templatepath: 'app/index.html',
            target: 'body',
            strategy: 'replace'
          }), 'receipts-item-view'),
        url('^receipts/', include('receipts/urls'))
      ];
    }
);
