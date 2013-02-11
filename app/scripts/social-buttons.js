(function(app, $, location) {
  'use strict';

  var $tweetContainer = $('.share-button.twitter');
  var $tweetButton = $('.twitter-share-button').clone();

  app.vent.on('route', function() {
    $tweetButton.attr('data-url', location.toString());
    $tweetContainer.empty().append($tweetButton);
    twttr.widgets.load($tweetContainer[0]);
  });
}(app, $, window.location));
