(function(app, Backbone) {
  'use strict';

  var ErrorMessageView = function(term, message, top) {
    this.term = term;
    this.message = message;
    this.$el = $('<div/>').addClass('error-container');
    this.$el.css('top', top + 'px');
    this.template = _.template('<p class="error">The phrase <strong><%= term %></strong> <%= message %>.</p>')
  };

  ErrorMessageView.prototype.render = function() {
    return this.$el.append(this.template(this));
  };

  var TermNotFoundView = function(term, top) {
    this.term = term;
    this.$el = $('<div/>').addClass('error-container');
    this.$el.css('top', top + 'px');
    this.template = _.template('<p class="error">No mentions of <strong><%= term %></strong> found. <br />Please try a different search term.</p>')
  };

  TermNotFoundView.prototype.render = function() {
    return this.$el.append(this.template(this));
  };

  app.Views.ErrorMessageView = ErrorMessageView;
  app.Views.TermNotFoundView = TermNotFoundView;

}(app, Backbone));
