/*! Angular-PDF Version: 0.5.1 | (C) Sayanee Basu 2014, Matt Edlefsen 2015 released under an MIT license */
(function() {

  'use strict';

  angular.module('pdf', []).directive('ngPdf', [ '$window', function($window) {
    return {
      restrict: 'E',
      scope: {
        src: '@',
        page: '=?',
        total: '=?',
        scale: '=?',
        rotate: '=?',
        error: '=?',
        pdfDoc: '=?',
        rendering: '=?',
        rendered: '=?',
      },
      template: '<canvas style="display: block;"></canvas>',
      link: function(scope, element, attrs) {
        var canvas = element[0].getElementsByTagName('canvas')[0];
        var ctx = canvas.getContext('2d');
        var pdfDoc;
        var currentPage;

        PDFJS.disableWorker = true;
        PDFJS.disableRange = true;

        var getDoc = function() {
          PDFJS.getDocument(scope.src, null, null, scope.onProgress).then(function(_pdfDoc) {
            if (typeof scope.onLoad === 'function') {
              scope.onLoad();
            }

            pdfDoc = _pdfDoc;
            scope.$apply(function() {
              scope.pdfDoc = _pdfDoc;
              scope.total = _pdfDoc.numPages;
            });

            scope.render();

          }, function(error) {
            if (error) {
              scope.$apply(function() {
                scope.error = error;
              });
            }
          });
        };
        scope.$watch('src', getDoc);

        scope.rendering = false;
        scope.render = function() {
          if(!pdfDoc || scope.rendering) return;
          var pageCount = pdfDoc.numPages;

          // Changing page will rerender, so just return
          if(!(scope.page > 0)) {
            scope.page = 1;
            return;
          } else if(scope.page > pageCount) {
            scope.page = pageCount;
            return;
          } else if(currentPage === scope.page) {
            return;
          }
          scope.rendering = true;
          currentPage = scope.page;

          pdfDoc.getPage(scope.page).then(function(page) {
            var scale = scope.scale;
            if(attrs.fitWidth != null){
              var bbox = element[0].parentNode.getBoundingClientRect();
              scale = bbox.width / page.getViewport(1).width;
            } else if(!scope.scale) {
              scale = 1;
            }
            if(scale != scope.scale) scope.$apply(function() { scope.scale = scale; });

            var viewport = page.getViewport(scale)

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            var renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };

            page.render(renderContext).promise.then(function() {
              scope.rendering = false;
              scope.rendered = true;
            });
          });
        };

        var setRotate = function() {
          var rotate = scope.rotate == null ? 0 : Number.parseInt(scope.rotate);
          if (rotate === 0) {
            canvas.setAttribute('class', 'rotate0');
          } else if (rotate === 90) {
            canvas.setAttribute('class', 'rotate90');
          } else if (rotate === 180) {
            canvas.setAttribute('class', 'rotate180');
          } else if (rotate === 270) {
            canvas.setAttribute('class', 'rotate270');
          }
        };
        getDoc();
        //setRotate();

        scope.$watch('page', scope.render);
        scope.$watch('scale', scope.render);
        scope.$watch('rotate', setRotate);
      }
    };
  }]);

})();
