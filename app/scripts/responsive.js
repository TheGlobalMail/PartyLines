(function(app) {
  'use strict';

  var $window = $(window);
  var currentSize;
  $window.on('resize', onResize);

  function getSize() {
    var h = $window.height(), w = $window.width();

    if (w < 1060) {
        return 'small';
    }

    if (w < 1260 || h < 805) {
        return 'medium';
    }

    return 'large';
  }

  function onResize() {
    var newSize = getSize();

    if (newSize !== currentSize) {
      currentSize = newSize;
      app.vent.trigger('viewport:resized', newSize);
    }
  }

  // run on resize
  onResize();

  app.reqres.addHandler('viewport:size', function() {
    return currentSize;
  });

}(app));
