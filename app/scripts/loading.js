(function(app, $) {
  'use strict';

  var $loading = $('<strong id="charts-loading" style="margin:0 auto">Loading charts</strong>');


  var states = {
    start: function() {
      app.$ui.chart.empty().append($loading);
    },

    done: function() {
      $loading.detach();
    }
  };

  app.vent.on('loading', function(state) {
    if (state in states) {
      states[state]();
    }
  });
}(app, $));
