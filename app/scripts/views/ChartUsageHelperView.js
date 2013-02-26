(function(app, Backbone) {
  'use strict';

  var ChartUsageHelperView = Backbone.View.extend({

    events: {
      'mouseenter': 'hide',
      'touchstart': 'hide'
    },

    mouseMessage: '<strong>Explore the graph:</strong> Select individual weeks and view the words in context below',
    touchMessage: '<strong>Explore the graph:</strong> Touch and hold, then slide left or right and release to view the words in context below',

    initialize: function() {
      this.$el.hide();

      this.listenTo(app.vent, 'chart:hover', this.hide);
      this.listenTo(app.vent, 'terms:loading', this.hide);

      this.listenTo(app.vent, 'chart:unselected', this.show);
      this.listenTo(app.vent, 'terms:loaded', this.show);
    },

    render: function() {
      var message = (Modernizr.touch) ? this.touchMessage : this.mouseMessage;
      var html    = '<p>' + message + '</p>';
      return this.$el.empty().append(message);
    },

    show: function() {
      if (this.hasTouched) {
        return false;
      }

      this.$el.fadeIn('fast');
    },

    hide: function(e) {
      if (e && e.type === 'touchstart') {
        this.hasTouched = true;
      }

      this.$el.fadeOut('fast');
    }

  });

  new ChartUsageHelperView({ el: $('#chart-usage-helper') }).render();
}(app, Backbone));
