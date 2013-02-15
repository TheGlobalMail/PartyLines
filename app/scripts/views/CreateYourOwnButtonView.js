(function(app, Backbone) {
  'use strict';

  if (!app.config.allowCustomSearches) {
    return false;
  }

  var CreateYourOwnButtonView = Backbone.View.extend({

    tagName: 'button',
    className: 'btn btn-large create-your-own',

    events: {
      'click': 'onClick'
    },

    onClick: function() {
      app.vent.trigger('search:prompt');
    },

    render: function() {
      return this.$el.prop('href', '/searchprompt')
        .text('Create your own searches');
    }

  });

  var view = new CreateYourOwnButtonView();

  var $container = $('#coming-soon');
  $container.empty().prop('id', 'create-your-own-button').append(view.render());
}(app, Backbone));
