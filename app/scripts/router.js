(function(app, _, $, Backbone) {
  'use strict';

  app.Router = Backbone.Router.extend({

    routes: {
      '': 'index',
      'preset/:name': 'searchPreset'
    },

    initialize: function(options) {
      this.options = options;
    },

    index: function() {
      this.navigate('preset/' + this.options.defaultPreset);
      this.searchPreset(this.options.defaultPreset);
    },

    searchPreset: function(name) {
      app.loadData(name);
    }

  });


}(app, _, Backbone.$, Backbone));