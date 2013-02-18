(function(app, Backbone) {
  'use strict';

  if (!app.config.allowCustomSearches) {
    return false;
  }

  var CreateYourOwnModal = Backbone.View.extend({

    events: {
      'submit form': 'onSubmit',
      'shown': 'onShown',
      'keydown input': 'doSubmitButtonState',
      'keyup input': 'doSubmitButtonState',
      'focus input:text': 'selectValue',
      'click .clear-field': 'clearField'
    },

    initialize: function() {
      _.bindAll(this, 'onSubmit', 'onShown', 'updateTerms', 'clearField');

      this.$form   = this.$('form');
      this.$submit = this.$form.find('input:submit');
      this.$inputs = this.$form.find('input:text');
      this.$checkboxes = this.$form.find('input:checkbox');

      this.listenTo(app.vent, 'search:prompt', this.show, this);
      this.listenTo(app.vent, 'search:searched', this.updateTerms, this);
    },

    show: function() {
      this.doSubmitButtonState();
      this.$el.modal('show');
    },

    hide: function() {
      this.$el.modal('hide');
    },

    onSubmit: function(e) {
      e.preventDefault();

      if (this.$submit.is(':disabled')) {
        return false;
      }

      app.commands.execute('search:terms', this.getTerms());
      this.hide();
      return false;
    },

    onShown: function() {
      this.$form.find('input:text:first').focus();
    },

    getTerms: function() {
      var terms = this.$form.serializeArray();

      terms = _.chain(terms)
        .filter(function(d) {
          return d.name === "terms[]" && d.value.length;
        })
        .pluck('value')
        .value();

      return _.map(terms, function(term, i) {
        return { term: term, exactMatch: this.$checkboxes.eq(i).is(':checked') };
      }, this);
    },

    updateTerms: function(terms) {
      // clear form
      this.$inputs.val('');
      this.$checkboxes.prop('checked', null);

      // set new values
      _.each(terms, function(search, i) {
        this.$inputs.eq(i).val(search.term);
        this.$checkboxes.eq(i).prop('checked', search.exactMatch);
      }, this);
    },

    doSubmitButtonState: function() {
      // type cast false to null for removing disabled property
      var formHasValue = !_.some(this.$inputs, 'value') || null;
      this.$submit.prop('disabled', formHasValue);
    },

    // will select/highlight the value of the checkbox
    // in the event if it has a value
    selectValue: function(e) {
      var $input = $(e.currentTarget);

      if (e.currentTarget.value) {
        $input.select();
      }
    },

    clearField: function(e) {
      console.log('clearField', e);
      var $el = $(e.currentTarget);
      this.$inputs.eq($el.data('index')).val('');
      e.preventDefault();
      this.doSubmitButtonState();
      return false;
    }

  });

  new CreateYourOwnModal({ el: $('#custom-search-modal') });

}(app, Backbone));
