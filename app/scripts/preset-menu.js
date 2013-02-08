(function(app, $) {
  'use strict';

  var $items = $("#preset-keywords li");

  app.vent.on('preset', function(name) {
    name = name.replace(/ /g, '-');
    _.each($items, function(item) {
      var $item = $(item);

      if ($item.find('a').prop('href').search(name) !== -1) {
        $items.filter('.active').removeClass('active');
        $item.addClass('active');
      }
    });
  });
}(app, $));
