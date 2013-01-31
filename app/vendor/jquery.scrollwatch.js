(function($) {
  'use strict';

  // cache window as jQuery object
  var $window = $(window);

  var ScrollWatch = function(el, options) {
    _.bindAll(this, 'handleScroll', 'listen');

    this.el = el;
    this.$el = $(el);

    this.options = _.defaults(options || {}, {
      throttle: 100,
      inThreshold: 0.6,
      outThreshold: 0
    });

    this.inViewport = false;
    this.callbacks = { "scrollin": $.Callbacks(), "scrollout": $.Callbacks() };
  };

  ScrollWatch.prototype = {

    listen: function() {
      var curTime = +new Date();
      if (!this.lastRun || (this.lastRun && (curTime - this.lastRun) >= this.options.throttle)) {
        this.lastRun = +new Date();
        this.handleScroll();
      }

      if (!this.cancelListen) {
        requestAnimationFrame(this.listen);
      }
    },

    on: function(event, options, callback, thisArg) {
      if (_.isFunction(options)) {
        callback = options;
        thisArg = callback;
        options = {};
      }

      options = _.extend({}, this.options, options);
      callback = _.bind(callback, thisArg || this.$el);

      // delay handler
      if (options.delay) {
        callback = this._createDelayedCallback(event, callback, options);
      }

      this.callbacks[event].add(callback);

      if (!this.isListening) {
        this.isListening = true;
        this.listen();
      }
      return this;
    },

    _createDelayedCallback: function(event, cb, options) {
        return function() {
          var args = arguments;
          _.delay(function() {
                cb.apply(null, args)
            }, options.delay);
        };
    },

    handleScroll: function() {
      if (!this.callbacks) { return; }

      var inViewport = this.isInViewport();
      var currentOffset = $window.scrollTop();

      if (!this.lastOffset) {
        this.direction = false;
      } else {
        this.direction = (currentOffset > this.lastOffset) ? 'down' : 'up';
      }

      this.lastOffset = currentOffset;

      if (!this.inViewport && inViewport > 0.6) {
        this.inViewport = true;
        this.trigger('scrollin');
      } else if (this.inViewport && inViewport === 0) {
        this.inViewport = false;
        this.trigger('scrollout');
      }

      return this;
    },

    trigger: function(event)
    {
      if (event === this.lastTriggered) {
        return false;
      }

      this.lastTriggered = event;
      this.callbacks[event].fire({ direction: this.direction });
    },

    isInViewport: function() {
      var scrollTop = $window.scrollTop();
      var windowHeight = $window.height();
      var scrollBottom = scrollTop + windowHeight;

      var elTop = this.$el.offset().top;
      var elHeight = this.$el.outerHeight();
      var elBottom = elTop + elHeight;

      // element taller than the viewport and the top is in the viewport
      if (elHeight > windowHeight && elTop > scrollTop && elTop < scrollBottom) {
        if (elTop - scrollTop < windowHeight * 0.5) {
          return 1;
        }
      }

      // element small then viewport fully in view
      if (elHeight < windowHeight && elTop > scrollTop && elBottom < scrollBottom) {
        return 1;
      }

      // element bleeding off the bottom of the viewport
      if (elTop > scrollTop && elTop < scrollBottom) {
        return (scrollBottom - elTop) / elHeight;
      }

      // element bleeding off the top of the viewport
      if (elBottom > scrollTop && elBottom < scrollBottom) {
        return (scrollTop - elBottom) / elHeight;
      }

      return 0;
    },

    off: function() {
      this.cancelListen = true;
      this.callbacks = { "scrollin": $.Callbacks(), "scrollout": $.Callbacks() };
    }

  };

  window.ScrollWatch = ScrollWatch;

  $.fn.scrollWatch = function(options) {
    var $this = $(this),
        data = $this.data('scrollWatch');

    if (options === 'destory' && data) {
      data.off();
      $this.data('scrollWatch', null);
      return this;
    }

    if (!data) {
      $this.data('scrollWatch', (data = new ScrollWatch(this, options)));
    }

    return data;
  };

}(jQuery));
