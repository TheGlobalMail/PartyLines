(function(app, $, location) {
  'use strict';

  var $tweetContainer = $('.share-button.twitter');
  var $tweetButtonTemplate = $('.twitter-share-button-template');
  var widgetJs = $.getScript("//platform.twitter.com/widgets.js");

  function createTweetButton(url) {
    var $button = $tweetButtonTemplate.clone();
    $button.removeAttr('style');
    $button.attr('data-url', url);
    $button.attr('class', 'twitter-share-button');

    return $button;
  }

  app.vent.on('route', function() {
    $tweetContainer.empty().append(createTweetButton(location.toString()));

    widgetJs.done(function() {
      twttr.widgets.load($tweetContainer[0]);
    });
  });
}(app, $, window.location));
