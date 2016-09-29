define(
  ['storeys/conf/settings', 'storeys/views/generic/base'],
  function(settings, base) {
    return new base.TemplateView({
      templatepath: 'receipts/list.html',
      target: 'body',
      strategy: 'replace'
    });
  }
);
