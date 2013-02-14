(function(app, Backbone) {
  'use strict';

  var RelativeScaleControlView = Backbone.View.extend({

    events: {
      'click': 'onClick'
    },

    initialize: function() {
      _.bindAll(this, 'onClick');
      app.reqres.addHandler('relativeScale:enabled', this.isChecked, this);
    },

    onClick: function() {
      app.vent.trigger('relativeScale:toggled', this.isChecked());
    },

    isChecked: function() {
      return this.$el.find(':checkbox').is(':checked');
    }

  });

  new RelativeScaleControlView({ el: $('#relative-scale-container') });
}(app, Backbone));
