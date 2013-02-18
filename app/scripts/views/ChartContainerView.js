(function(app, Backbone, d3) {
  'use strict';

  var ChartContainerView = Backbone.View.extend({

    initialize: function() {
      this._initStyling();
      this.chartSliderView = new app.Views.ChartSliderView();
    },

    _initStyling: function() {
      this.styling = {
        margin: {
          top: 30,
          superTop: 40,
          topXAxisMargin: 20,
          right: 100,
          bottom: 0,
          left: 30
        },

        chartHeight: 215
      };

      this.styling.width  = 960 - this.styling.margin.left - this.styling.margin.right;
      this.styling.height = this.styling.chartHeight - this.styling.margin.top - this.styling.margin.bottom;
    },

    render: function(terms, data, weeks) {
      dataProcessor.process(data, weeks);

      this.$el.empty(); // clear existing

      this.svg = d3.select(this.el).append('svg')
        .attr({
          width:  this.styling.width + this.styling.margin.left + this.styling.margin.right,
          height: this.styling.chartHeight * data.length + this.styling.margin.superTop
        });

      this.containers = {};

      this.containers.charts = this.svg.append('g').attr('class', 'charts');
      this.containers.text   = this.svg.append('g')
        .attr('class', 'text-overlay')
        .attr('pointer-events', 'none');

      this.renderCharts(terms, data, weeks);
    },

    // this method is only here to replicate existing functionality
    // it will be removed once we moved to async chart loading/rendering
    renderCharts: function(terms, data, weeks) {
      this.charts = [];

      _.each(terms, function(term, index) {
        this._renderChart(term, index, data[index])
      }, this);

      var chartSliderViewsOptions = _.extend({}, this.styling, {
        textContainer: this.containers.text
      });

      this.chartSliderView.render(this.containers.charts, chartSliderViewsOptions, this.charts);
    },

    _renderChart: function(term, index, data) {
      var options = _.extend({}, this.styling, {
        index: index,
        term: term,
        id: term.toLowerCase().replace(/\s+/g, '_'),
        svg: this.containers.charts,
        textContainer: this.containers.text,
        series: data.series
      });

      if (app.reqres.request('relativeScale:enabled')) {
        options.max = data.max;
      } else {
        options.max = _.chain(app.data).pluck('max').max().value();
      }

      options.top = options.margin.superTop + (options.height + options.margin.top) * options.index;

      if (data.message) {
        var error = new app.Views.ErrorMessageView(data.message, options.top);
        this.$el.append(error.render());
      }else if (!data.data.length) {
        var notFound = new app.Views.TermNotFoundView(term, options.top);
        this.$el.append(notFound.render());
      }

      this.charts[index] = new Chart(options);
    }

  });


  // TODO move to own file?
  var dataProcessor = {

    process: function(data, weeks) {
      _.each(data, function(d) {
        d.series = dataProcessor.prepareSeries(d.data, weeks);
        d.max    = dataProcessor.findMax(d.series);
      });
    },

    prepareSeries: function(data, weeks) {
      var series = [];
      var party  = { name: false };
      var filterParty = app.filterParty && app.parties[app.filterParty];

      _.each(data, function(d) {
        // Allow users to filter out parties
        if (filterParty && d.party !== filterParty.name) {
          return;
        }

        if (d.party !== party.name) {
          if (party.name) {
            series.push(party);
          }

          party = { name: d.party, data: [] };
        }

        var weeksIndex = app.weeksIndex[d.week];
        party.data.push({ x: weeksIndex, y: d.freq });
      });

      if (party.name) {
        series.push(party);
      }

      // fill out data with zeroes if there's no data for a given week
      _.each(series, function(partyData) {
       var xPoints = _.pluck(partyData.data, 'x');

        partyData.data = _.map(weeks, function(week) {
          var weekIndex = app.weeksIndex[week];
          var matchingIndex = xPoints.indexOf(weekIndex);

          if (matchingIndex === -1) {
            return { x: weekIndex, y: 0 };
          }

          return partyData.data[matchingIndex];
        });
      });

      return series;
    },

    findMax: function(series) {
      var stackedYValues = [];

      _.each(series, function(party) {
        _.each(party.data, function(datum, i) {
          if (stackedYValues.length < i + 1) {
            stackedYValues.push(datum.y);
          } else {
            stackedYValues[i] += datum.y;
          }
        });
      });

      return _.max(stackedYValues);
    }

  };

  app.Views.ChartContainerView = ChartContainerView;

}(app, Backbone, d3));
