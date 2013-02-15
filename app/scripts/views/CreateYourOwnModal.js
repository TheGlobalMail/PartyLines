(function(app, Backbone) {
  'use strict';

  if (!app.config.allowCustomSearches) {
    return false;
  }

  var CreateYourOwnModal = Backbone.View.extend({

<<<<<<< HEAD
    initialize: function() {
      this.listenTo(app.vent, 'search:prompt', this.show);
=======
    events: {
      'submit form': 'onSubmit',
      'shown': 'onShown'
    },

    initialize: function() {
      _.bindAll(this, 'onSubmit', 'onShown', 'updateTerms');
      this.$form = this.$('form');
      this.listenTo(app.vent, 'search:prompt', this.show, this);
      this.listenTo(app.vent, 'search:loaded', this.updateTerms, this);
>>>>>>> custom-searching
    },

    show: function() {
      this.$el.modal('show');
    },

    hide: function() {
      this.$el.modal('hide');
<<<<<<< HEAD
=======
    },

    onSubmit: function(e) {
      e.preventDefault();
      app.commands.execute('search:terms', this.getPhrases());
      this.hide();
      return false;
    },

    onShown: function() {
      this.$form.find('input:first').focus();
    },

    getPhrases: function() {
      var data = this.$form.serializeArray();
      return _.chain(data)
        .filter(function(d) {
          return d.name === "phrases[]" && d.value.length;
        })
        .map(function(d) {
          return d.value
            .replace(/\s+/g, '+')
            .replace('[^a-zA-Z0-9\-\+', '');
        })
        .value();
    },

    updateTerms: function(terms) {
      var $inputs = this.$form.find('input:text');

      _.each(terms, function(term, i) {
        $inputs.eq(i).val(term);
      });
>>>>>>> custom-searching
    }

  });

  new CreateYourOwnModal({ el: $('#custom-search-modal') });

}(app, Backbone));
