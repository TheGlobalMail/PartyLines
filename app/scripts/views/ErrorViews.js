(function(app, Backbone) {
  'use strict';

  var ErrorMessageView = function(message, top) {
    this.message = message;
    this.$el = $('<div/>').addClass('error-container');
    this.$el.css('top', top + 'px');
    this.template = _.template('<p class="error"><strong><%= message %></strong>. Please try again and let us know if this message doesn\'t make sense.</p>')
  };

  ErrorMessageView.prototype.render = function() {
    return this.$el.append(this.template(this));
  };

  var TermNotFoundView = function(term, top) {
    this.term = term;
    this.$el = $('<div/>').addClass('error-container');
    this.$el.css('top', top + 'px');
    this.template = _.template('<p class="error">No mentions of <strong><%= term %></strong> found. Try a different term or search openaustralia.org for inspiration.</p>')
  };

  TermNotFoundView.prototype.render = function() {
    return this.$el.append(this.template(this));
  };

  app.Views.ErrorMessageView = ErrorMessageView;
  app.Views.TermNotFoundView = TermNotFoundView;

}(app, Backbone));
