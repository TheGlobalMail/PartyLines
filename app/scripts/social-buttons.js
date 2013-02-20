(function(app, $, location) {
  'use strict';

  var $tweetContainer = $('.share-button.twitter');
  var $tweetButtonTemplate = $('.twitter-share-button-template');
  var widgetJs = $.getScript("//platform.twitter.com/widgets.js");

  var $likeContainer = $('.share-button.facebook');
  var $likeButtonTemplate = $('.fb-like');

  function createTweetButton(url) {
    var $button = $tweetButtonTemplate.clone();
    $button.removeAttr('style');
    $button.attr('data-url', url);
    $button.attr('class', 'twitter-share-button');

    return $button;
  }

  function createLikeButton(url) {
    return $likeButtonTemplate.clone();
  }

  $likeContainer.empty().append(createLikeButton(location.toString()));

  app.vent.on('route', function() {
    $tweetContainer.empty().append(createTweetButton(location.toString()));

    widgetJs.done(function() {
      if (typeof twttr !== 'undefined' && 'widgets' in twttr) {
        twttr.widgets.load($tweetContainer[0]);
      }
    });
  });
}(app, $, window.location));
