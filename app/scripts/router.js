(function(app, _, $, Backbone) {
  'use strict';

  app.Router = Backbone.Router.extend({

    routes: {
      '': 'index',
      'preset/:name': 'searchPreset',
      'search/(*terms)': 'searchCustom'
    },

    initialize: function(options) {
      this.options = options;
      app.commands.addHandler('search:terms', this.setSearchTerms, this);
    },

    index: function() {
      this.navigate('preset/' + this.options.defaultPreset);
      this.searchPreset(this.options.defaultPreset);
    },

    searchPreset: function(name) {
      name = name.replace(/-/g, ' ');
      app.loadData(name);
      app.vent.trigger('preset', name);
    },

    searchCustom: function(terms) {
      terms = terms.replace(/\+/g, ' ').split('/');
      terms = _.filter(terms, function(t) { return t; });
      this._loadTerms(terms.slice(0, 4));
    },

    setSearchTerms: function(terms) {
      this.navigate(['search'].concat(terms).join('/').slice(0, 4));
      this._loadTerms(terms);
    },

    _loadTerms: function(terms) {
      app.terms = terms;
      app.reloadData();
      app.vent.trigger('search:loaded', terms);
    }

  });

}(app, _, Backbone.$, Backbone));
