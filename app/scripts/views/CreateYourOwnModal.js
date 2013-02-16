(function(app, Backbone) {
  'use strict';

  if (!app.config.allowCustomSearches) {
    return false;
  }

  var CreateYourOwnModal = Backbone.View.extend({

    events: {
      'submit form': 'onSubmit',
      'shown': 'onShown'
    },

    initialize: function() {
      _.bindAll(this, 'onSubmit', 'onShown', 'updateTerms');
      this.$form = this.$('form');
      this.listenTo(app.vent, 'search:prompt', this.show, this);
      this.listenTo(app.vent, 'search:searched', this.updateTerms, this);
    },

    show: function() {
      this.$el.modal('show');
    },

    hide: function() {
      this.$el.modal('hide');
    },

    onSubmit: function(e) {
      e.preventDefault();
      app.commands.execute('search:terms', this.getTerms());
      this.hide();
      return false;
    },

    onShown: function() {
      this.$form.find('input:first').focus();
    },

    getTerms: function() {
      var terms = this.$form.serializeArray();
      var $checkboxes = this.$form.find(':checkbox');

      terms = _.chain(terms)
        .filter(function(d) {
          return d.name === "terms[]" && d.value.length;
        })
        .pluck('value')
        .value();

      return _.map(terms, function(term, i) {
        return { term: term, exactMatch: $checkboxes.eq(i).is(':checked') };
      });
    },

    updateTerms: function(terms) {
      var $inputs   = this.$form.find('input:text'); 
      var $checkbox = this.$form.find(':checkbox');

      _.each(terms, function(search, i) {
        $inputs.eq(i).val(search.term);
        $checkbox.eq(i).prop('checked', search.exactMatch);
      });
    }

  });

  new CreateYourOwnModal({ el: $('#custom-search-modal') });

}(app, Backbone));
