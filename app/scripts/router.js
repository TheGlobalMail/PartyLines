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
      this.navigate('preset/' + this.options.defaultPreset, { replace: true });
      this.searchPreset(this.options.defaultPreset);
    },

    searchPreset: function(name) {
      name = name.replace(/-/g, ' ');
      app.loadData(name);
      app.vent.trigger('preset', name);
    },

    searchCustom: function(terms) {
      this._loadTerms(termParser.parse(terms));
    },

    setSearchTerms: function(terms) {
      this.navigate('search/' + termParser.compile(terms));
      this.trigger('route');
      this._loadTerms(terms);
    },

    _loadTerms: function(terms) {
      app.searchTerms(terms);
      app.vent.trigger('search:searched', terms);
    }

  });


  var termParser = {

    compile: function(terms) {
      return _.map(terms, function(search) {
        var bit = search.term.replace(/\s+/g, '+')
                            .replace(/[^a-zA-Z0-9\-\+]+/g, '');

        if (search.exactMatch) {
          bit += ':exact';
        }

        return bit;
      }).slice(0, 4).join('/');
    },

    parse: function(uri) {
      var bits = uri.replace(/\++/g, ' ').split('/');

      return _.chain(bits)
        .map(function(bit) {
          var search = { term: bit, exactMatch: false };
          var match = bit.match(/^(.+):exact$/);

          if (match !== null) {
            search = { term: match[1], exactMatch: true };
          }

          search.term = search.term.replace(/[^a-zA-Z0-9\-\ ]+/g, '');

          return search;
        })
        .filter(function(search) {
          // filter out empty searches
          return search.term;
        })
        .value().slice(0, 4);
    }

  };

}(app, _, Backbone.$, Backbone));
