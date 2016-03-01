Storeys is a client-side JavaScript framework for developing maintainable web applications.

Storeys is web ready: supports webpages served entirely by web servers. It is highly scalable as most of its content can be served as static assets.

Storeys is also hybrid-mobile-app ready: an entire app can be stored in the local filesystem or packaged with Phonegap (Cordova), accessing RESTful web API.

Storeys is pro-isomorphic: supports server-side web frameworks such as Python Django (or other framework for JinJa) as well as being used as a SPF (Structured Page Fragment) library.

---

Storeys borrows its concepts and terminologies heavily from Django. The worlds of Storeys begins with a root `urls.js`

```js
# file: storeys-project-example/apps/static/urls.js

define(
    ['storeys/conf/urls'],
    function(urls) {
      var url     = urls.url,
          include = urls.include;

      return [
          url('^receipts/', include('receipts/urls')),
          url('^accounts/', include('accounts/urls')),
          url('^aboutus/$', TemplateView.as_view(template_name='home/aboutus.html'),
              name='aboutus'),
      ];
    }
);
```
