define(
    ['require', 'module', 'jquery', 'storeys/template/response', 'storeys/resources/css', 'storeys/utils/promise'],
    function(require, module, $, response, css, Q) {
      var EMPTY_PROMISE = Q.resolve();
      var TemplateResponse = response.TemplateResponse;

      // ===========================================
      //                    Public
      // ===========================================

      // -------------------------------------------
      //                     View
      // -------------------------------------------
      function View(config) {
        this.config = config;
      }
      View.prototype.constructor = function(config) {
      };
      View.prototype.dispatch = function(req, params) {
        var promise,
            method = !req.method? '': req.method.toUpperCase();

        if (method === 'GET') {
          promise = this.get.apply(this, arguments) || EMPTY_PROMISE;
        } else if (method === 'POST') {
          promise = this.post.apply(this, arguments) || EMPTY_PROMISE;
        } else {
          promise = Q.reject('Method "' + req.method + '" is unknown and was skippped.');
        }
        return promise;
      };
      View.prototype.render = function(req, params) {
        return {
          status: 200,
          content: ''
        }
      };
      View.prototype.swap = function(res) {
        var dom,
            config = this.config || {},
            $page;

        if (res.status >= 200 && res.status < 300) {
          if ('target' in config === false) {
            window.document.write(res.content);
            window.document.close();
          } else if (config.target) {
            if (config.target === 'body') {
              if (!config.strategy || config.strategy === 'append') {
                if (config.page) {
                  $page = $(config.page);
                  if (!$page.length) {
                    $('body').append(res.content);
                  } else {
                    $page.html(res.content);
                  }
                  $('.storeys > .current').removeClass('current');
                  $(config.page).addClass('current');
                } else {
                  $('body').append(res.content);
                }
              } else if (config.strategy === 'replace') {
                $('body').children().remove();
                $('body').append(res.content);
              }
            } else {
              dom = document.querySelector(config.target);
              if (dom) {
                dom.innerHTML = res.content;
              } else {
                throw 'Cannot find target "' + res.target + '"';
              }
            }
            res.status = 204;
          }
        }

        return res;
      };
      View.prototype.loaded = function(res) {
        if (this.config && 'loaded' in this.config) {
          return this.config.loaded.apply(this, arguments);
        } else {
          return res;
        }
      };
      View.prototype.get = function(req, params) {
        var instance = this;
        return (
            this.render(req, params)
                .then(function(res) {
                  return instance.swap(res);
                })
                .then(function(res) {
                  return instance.loaded(res);
                })
        );
      };
      View.prototype.post = function(req, params) {
        return EMPTY_PROMISE;
      };

      // -------------------------------------------
      //                TemplateView
      // -------------------------------------------
      function TemplateView(config) {
        this.config = config;
      }
      TemplateView.prototype = new View();
      TemplateView.prototype.constructor = View;
      TemplateView.prototype.render = function(req, params) {
        var config = this.config,
            templatepath = config.templatepath,
            tr = TemplateResponse(templatepath),
            promise;

        if (config.csspaths) {
          promise = css.load(config.csspaths);
        } else {
          promise = EMPTY_PROMISE;
        }
        promise = promise.then(function() {
          var $page = $(config.page);

          if (!$page.length) {
            return tr(req, params);
          } else {
            return {
              status: 204,
              content: $page.html()
            };
          }
        });

        return promise;
      };

      return {
        View: View,
        TemplateView: TemplateView
      };
    }
);
