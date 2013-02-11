(function(app, $, location) {
  'use strict';

  var $tweetButton = $('.twitter-share-button');

  app.vent.on('route', function() {
    $tweetButton.attr('data-url', location.toString());
  });
}(app, $, window.location));
