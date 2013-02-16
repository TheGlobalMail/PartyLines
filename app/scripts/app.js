(function(app) {
  'use strict';

  app.api = new Api();

  // TODO move into view
  app.vent.on('relativeScale:toggled', function(isChecked) {
    app.reloadData();
  });

  // load weeks
  app.api.weeksLoaded().done(function(weeksData) {
    app.weeks = weeksData;
    app.weeks.push(_.last(app.weeks) + " ");
    app.weeksIndex = _.object(weeksData, _.range(weeksData.length));
  });

  var chartContainerView = new app.Views.ChartContainerView({ el: app.$ui.chart[0] });

  app.loadData = function(presetName) {
    app.terms = app.presets[presetName];
    
    var terms = _.map(app.terms, function(term) {
      return { term: term, exactMatch: true };
    });

    app.searchTerms(terms);
  };

  app.searchTerms = function(terms) {
    app.vent.trigger('terms:loading');

    app.searches = terms;
    app.terms    = _.pluck(terms, 'term');

    app.reloadData();
  };

  app.reloadData = function() {
    app.api.whenWeeksAndTermsLoaded(app.searches).done(function(data) {
      app.data = data;
      app.vent.trigger('terms:loaded', app.terms);
      chartContainerView.render(app.terms, data, app.weeks);
    });
  }

}(window.app));
