(function(app) {
  'use strict';

  var _gaq = window._gaq || [];

  app.vent.on('search:searched', function(terms) {
    _.each(terms, function(search) {
      _gaq.push(['_trackEvent', 'Custom Searches', 'Term', search.term]);
    });
  });

  app.vent.on('preset', function(name) {
    _gaq.push(['_trackEvent', 'Presets', 'Name', name]);
  });
}(app));
