(function($) {
  'use strict';

  var $france = $('.france-map.map').fadeTo(0, 0);
  $france.scrollWatch()
    .on('scrollin', { delay: 100 }, function() {
      $france.fadeTo(100, 1);
    })
    .on('scrollout', function(e) {
      if (e.direction === 'up') {
        $france.fadeTo(100, 0);
      }
    });

}(jQuery));
