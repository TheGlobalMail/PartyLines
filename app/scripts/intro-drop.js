(function($, d3) {
  'use strict';

  var $drop = $('.drop');
  var $headings = $('h1, h2', '.intro-banner');
  var $main = $('#content-container').fadeTo(0, 0);
  var $window = $(window);
  var running = false;
  var mainHidden = true;
  var scrollTop, scrollBottom;
  var navbarHeight = $('.navbar').height();
  var headerBottom = $('header').offset().top + $('header').height();
  var dropAcceleration = 1.3;
  var dropIsPinned = false;
  var startOffset = 60;
  var start = $drop.offset().top - startOffset;

  var percentProgressed = function(start, end, current) {
    var spread = end - start;
    current = current - start;
    return current / spread;
  };

  // fade headings based on current scroll position
  var doHeadingFade = function() {
    var fadePercentage = 1 - percentProgressed(0, start, scrollTop);

    if (fadePercentage <= 0.1) {
      fadePercentage = 0;
    }

    if (fadePercentage >= 0 && fadePercentage <= 1) {
      $headings.fadeTo(0, fadePercentage);
    }
  };

  // pin drop once it hits the top of the page
  var doDropPin = function() {
    if (!dropIsPinned && scrollTop > start) {
      dropIsPinned = true;
      $drop.css({
        position: 'fixed',
        top: startOffset
      });
    } else if (dropIsPinned && scrollTop < start) {
      dropIsPinned = false;
      $drop.css({
        position: 'absolute',
        top: ''
      });
    }

    if (dropIsPinned) {
      var scaleFactor = dropAcceleration - 1;
      var maxTop = Math.ceil((headerBottom - start) * scaleFactor + startOffset);
      var scale = d3.scale.pow()
        .domain([start, headerBottom])
        .range([startOffset, maxTop]);

      var top = scale(scrollTop);

      if (top <= maxTop) {
        $drop.css('top', top);
      }
    }
  };

  var doContentFade = function() {
    var dropBottom = $drop.offset().top + $drop.height();
    var contentTop = $("#main").offset().top;

    if (dropBottom >= contentTop && mainHidden) {
      mainHidden = false;
      $main.fadeTo(300, 1);
    } else if (dropBottom < contentTop && !mainHidden) {
      mainHidden = true;
      $main.fadeTo(300, 0)
    }
  };

  var checkPosition = function() {
    if (running) { return; }

    running = true;
    doHeadingFade();
    doDropPin();
    doContentFade();

    running = false;
  };

  var run = function() {
    scrollTop = $window.scrollTop();
    scrollBottom = scrollTop + $window.height();
    checkPosition();
  };

  $window.on('scroll', run);
  run();

}(jQuery, d3));
