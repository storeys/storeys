define(
  ['storeys/conf/urls', 'storeys/views/generic/base', './views/list'],
  function(urls, base, list) {
    var url = urls.url,
        TemplateView = base.TemplateView;

    return [
      url('^list/$', list, 'receipts-list-view'),
      url('^receipt-(?P<pk>[0-9]+)$',
        new TemplateView({
          templatepath: 'receipts/item.html',
          target: 'body',
          strategy: 'replace'
        }), 'receipts-item-view'),
      url('^create/$',
        new TemplateView({
          templatepath: 'receipts/create.html',
          target: 'body',
          strategy: 'replace'
        }), 'receipts-create-view'),
      url('^$',
        new TemplateView({
          templatepath: 'receipts/index.html',
          target: 'body',
          strategy: 'replace'
        }), 'receipts-index-view')
    ];
  }
);
