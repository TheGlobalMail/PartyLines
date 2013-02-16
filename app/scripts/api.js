(function(app) {
  'use strict';

  // Welcome to Deferred City
  // TODO Can we use Backbone.Collection here?

  var Api = function() {
    this._termsLoaded = {};
  };

  Api.prototype.weeksLoaded = function() {
    if (!this._weeksLoaded) {
      this._weeksLoaded = $.getJSON(app.config.url + '/api/weeks');
    }

    return this._weeksLoaded;
  };

  Api.prototype.termLoaded = function(term, exactMatch) {
    var key = JSON.stringify({ term: term, exactMatch: exactMatch });

    if (!_.has(this._termsLoaded, key)) {
      this._termsLoaded[key] = $.getJSON(app.config.url + '/api/wordchoices/term/' + term, { c: exactMatch });
    }

    return this._termsLoaded[key];
  };

  Api.prototype.whenWeeksAndTermLoaded = function(term, exactMatch) {
    var dfd = new $.Deferred();

    $.when(this.weeksLoaded(), this.termLoaded(term, exactMatch))
      .then(function(weeks, term) {
        dfd.resolve(term);
      });

    return dfd.promise();
  };

  // this method is only to poly fill the old version of the app
  // termInfo should be like:
  // [ { term: 'termOne', exactMatch: true, term: 'termTwo', exactMatch: false }]
  Api.prototype.whenWeeksAndTermsLoaded = function(termsInfo) {
    // wrap this in our deferred so we can clean up the arguments in done(fn) callbacks
    var dfd = new $.Deferred();

    // start with the weeks promise
    var promises = [ this.weeksLoaded() ];

    // push a promise for each term
    _.each(termsInfo, function(termInfo) {
      promises.push(this.termLoaded(termInfo.term, termInfo.exactMatch));
    }, this);

    // when the weeks and terms are loaded, resolve our deferred with just the term data
    $.when.apply($, promises).done(function() {
      // don't need weeks data
      var args = _.rest(arguments);
      // pluck the json data off each arg object
      var data = _.pluck(args, 0);

      dfd.resolve(data);
    });

    // promises are nice for consuption
    return dfd.promise();
  };

  window.Api = Api;

}(app));
