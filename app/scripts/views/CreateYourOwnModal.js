(function(app, Backbone) {
  'use strict';

  if (!app.config.allowCustomSearches) {
    return false;
  }

  var CreateYourOwnModal = Backbone.View.extend({

    initialize: function() {
      this.listenTo(app.vent, 'search:prompt', this.show);
    },

    show: function() {
      this.$el.modal('show');
    },

    hide: function() {
      this.$el.modal('hide');
    }

  });

  new CreateYourOwnModal({ el: $('#custom-search-modal') });

}(app, Backbone));
