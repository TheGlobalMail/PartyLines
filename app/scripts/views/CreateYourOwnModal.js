(function(app, Backbone) {
  'use strict';

  if (!app.config.allowCustomSearches) {
    return false;
  }

  var CreateYourOwnModal = Backbone.View.extend({

    events: {
      'submit form': 'onSubmit'
    },

    initialize: function() {
      _.bindAll(this, 'onSubmit');
      this.$form = this.$('form');
      this.listenTo(app.vent, 'search:prompt', this.show);
    },

    show: function() {
      this.$el.modal('show');
    },

    hide: function() {
      this.$el.modal('hide');
    },

    onSubmit: function(e) {
      e.preventDefault();
      console.log(this.getFormData());
      return false;
    },

    getFormData: function() {
      return this.$form.serializeArray();
    }

  });

  new CreateYourOwnModal({ el: $('#custom-search-modal') });

}(app, Backbone));
