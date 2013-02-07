(function(window, _) {
  'use strict';

  var app = {
    url: "http://partylines-api.theglobalmail.org",

    parties: [
      { abbrev: 'DEM', name: 'Australian Democrats', colour: '#f3bf07' },
      { abbrev: 'GRN', name: 'Australian Greens', colour: '#33b26a' },
      { abbrev: 'ALP', name: 'Australian Labor Party', colour: '#e23c3f' },
      { abbrev: 'Country Lib', name: 'Country Liberal Party', colour: '#87b8da' },
      { abbrev: 'Democratic Lab', name: 'Democratic Labor Party', colour: '#f09d9f' },
      { abbrev: 'Family First', name: 'Family First Party', colour: '#ff835e' },
      { abbrev: 'IND', name: 'Independent', colour: '#b9b9b9' },
      { abbrev: 'LIB', name: 'Liberal Party', colour: '#1072b6' },
      { abbrev: 'NAT', name: 'National Party', colour: '#bd744d' }
    ],

    terms: {
      'immigraysh':  ['illegals', 'asylum', 'boat', 'knickerbocker'],
      'economy':     ['budget', 'spending', 'surplus', 'money'],
      'swear-words': ['shit', 'bugger', 'fuck', 'crap'],
      'ramblings':   ['sauce bottle', 'porn', 'toilet', 'kitten']
    },

    data: [],
    activeSliderBlind: null,
    selectedSliderBlind: null,
    loadTimer: null,
    activeWeek: null,

    vent: _.extend({}, Backbone.Events),

    $ui: {
      chart: $('#chart-container')
    }
  };

  window.app = app;
}(window, _));
