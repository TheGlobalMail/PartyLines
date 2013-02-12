(function(app) {
  'use strict';

  var weeksLoader;
  var hackedWeekAdded = false;

  app.usingRelativeScale = false;

  // TODO move into view
  $('#relative-scale').click(function(e){
    app.usingRelativeScale = $('#relative-scale').is(':checked');
    app.reloadData();
  });

  app.loadData = function(presetName) {
    this.presetName = presetName;
    this.reloadData();
  };

  app.reloadData = function() {
    this.terms = this.presets[this.presetName];

    if (!weeksLoader) {
      weeksLoader = $.getJSON(app.url + '/api/weeks');
    }

    weeksLoader.done(function(data) {
        app.vent.trigger('loading', 'start');
        app.weeks = data;
        // XXX hack to make step after render properly :(
        if (!hackedWeekAdded){
          app.weeks.push(_.last(app.weeks) + " ");
          hackedWeekAdded = true;
        }
        app.weeksIndex = _.object(data, _.range(data.length));

        var promises = _.map(app.terms, function(term) {
          return $.getJSON(app.url + '/api/wordchoices/term/' + term, { c: true });
        });

        $.when.apply($, promises).done(function() {
          app.vent.trigger('loading', 'done');
          app.data = _.map(arguments, function(arg) { return arg[0]; });
          renderCharts();
        });
      });
  };

  function renderCharts() {
    var margin = {
      top: 15,
      superTop: 40,
      topXAxisMargin: 20,
      right: 40,
      bottom: 0,
      left: 30
    };
    var individualChartHeight = 200;
    var width   = 900 - margin.left - margin.right;
    var height  = individualChartHeight - margin.top - margin.bottom;
    var options = {
      margin: margin,
      width: width,
      height: height
    };

    _.each(app.data, function(datum){
      datum.series = prepareSeries(datum.data);
      datum.max = findMax(datum.series);
    });

    if (!app.usingRelativeScale){
      options.max = _.max(_.pluck(app.data, 'max'));
    }

    app.charts = [];

    var svg = d3.select(app.$ui.chart[0]).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", individualChartHeight * app.terms.length + margin.superTop);

    var chartsContainer = svg.append('g').attr('class', 'charts');
    var textContainer  = svg.append('g')
      .attr('class', 'text-overlay')
      .attr('pointer-events', 'none');

    options.textContainer = textContainer;

    // set up axis
    _.each(app.terms, function(term, i) {
      options.index = i;
      var data = app.data[i];

      if (app.usingRelativeScale){
        options.max = data.max;
      }

      if (data.message) {
        return app.$ui.chart.append('<p class="error"><strong>' + data.message + "</strong>. Please try again and let us know if this message doesn't make sense.</p><br>");
      }

      if (!data.data.length) {
        return app.$ui.chart.append('<p class="error">No mentions of <strong>' + term + "</strong> found. Try a different term or search openaustralia.org for inspiration.</p><br>");
      }

      renderChart(chartsContainer, options, term, data.data);
    });

    renderSlider(chartsContainer, options);
  }

  function renderChart(svg, extraOptions, term, termData) {
    var series = prepareSeries(termData);
    var id     = idFromTerm(term);

    var options = _.extend({
      id: id,
      svg: svg,
      series: series,
      term: term
    }, extraOptions);

    app.charts.push(new Chart(options));
  }

  function prepareSeries(data) {
    var series = [];
    var party = {};
    var filterParty = app.filterParty && app.parties[app.filterParty];

    _.each(data, function(datum) {
      // Allow users to filter out parties
      if (filterParty && datum.party !== filterParty.name) return;

      if (datum.party !== party.name) {
        if (party.name) {
          series.push(party);
        }

        party = { name: datum.party, data: [] };
      }

      var weeksIndex = app.weeksIndex[datum.week];
      party.data.push({ x: weeksIndex, y: datum.freq });
    });

    if (party.name) {
      series.push(party);
    }

    _.each(series, function(partyData) {
      var filledSeries = [];
      var xPoints = _.pluck(partyData.data, 'x');

      _.each(app.weeks, function(week) {
        var weekIndex = app.weeksIndex[week];
        var matchingIndex = xPoints.indexOf(weekIndex);

        if (matchingIndex === -1) {
          filledSeries.push({ x: weekIndex, y: 0 });
        } else {
          filledSeries.push(partyData.data[matchingIndex]);
        }
      });

      partyData.data = filledSeries;
    });

    return series;
  }

  function findMax(series) {
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

  function idFromTerm(term) {
    return term.toLowerCase().replace(/^\s/g, '_');
  }


  function renderSlider(svg, options) {
    var fullHeight = app.data.length * (options.height + options.margin.top) + (options.margin.topXAxisMargin - options.margin.top);
    var data = _.map(app.weeks, function() { return fullHeight; });

    var xScale = d3.scale.ordinal()
      .rangeBands([0, options.width])
      .domain(app.weeks);

    var yScale = d3.scale.linear()
      .range([fullHeight, 0])
      .domain([0, fullHeight]);

    var sliderContainer = svg.append("g")
      .attr('id','slider-container')
      .attr("transform", "translate(" + options.margin.left + "," + (options.margin.superTop - options.margin.topXAxisMargin) + ")");

    sliderContainer.selectAll("rect")
      // XXX hack to make step after render properly :(
      .data(data.slice(0,-1))
      .enter().append("rect")
      .attr("x", function(d, i){ return xScale(i); })
      .attr("y", 0)
      .attr('class','slider-blind')
      .attr("width", xScale.rangeBand())
      .attr('data-week', function(d, i){
        return app.weeks[i];
      })
      .attr("height", fullHeight)
      .on('click', function() {
        var hansardIds = [];
        if (app.selectedSliderBlind){
          app.selectedSliderBlind.attr('class', 'slider-blind');
        }

        app.selectedSliderBlind = $(this);
        app.selectedSliderBlind.attr('class', 'slider-blind selected');
        app.selectedWeek = app.selectedSliderBlind.data('week');

        _.each(app.data, function(termData, i) {
          var countData = {
            week: formatWeek(app.selectedWeek),
            counts: []
          };

          _.each(termData.data, function(datum){
            var party;
            if (datum.week === app.selectedWeek && datum.freq > 0) {
              party = findParty(datum.party);
              if (party) {
                hansardIds.push(datum.ids);
              }
            }
          });
        });

        if (hansardIds.length) {
          app.hansardIds = hansardIds;

          if (app.loadTimer) {
            clearTimeout(app.loadTimer);
          }

          Snippets.requestSnippets();
          app.loadTimer = setTimeout(Snippets.loadSnippets, 500);
        }
      })
    .on('mouseover', function() {
      if (app.activeSliderBlind) {
        if (app.activeSliderBlind.attr('class').match(/selected/)) {
          app.activeSliderBlind.attr('class', 'slider-blind selected');
        } else {
          app.activeSliderBlind.attr('class', 'slider-blind');
        }
      }

      app.activeSliderBlind = $(this);

      if (!app.activeSliderBlind.attr('class').match(/selected/)) {
        app.activeSliderBlind.attr('class', 'slider-blind active');
      }

      app.activeWeek = app.activeSliderBlind.data('week');

      _.each(app.data, function(termData, i) {
        var countData = {
          week: formatWeek(app.activeWeek),
          counts: []
        };

        _.each(termData.data, function(datum) {
          var party;
          if (datum.week === app.activeWeek && datum.freq > 0){
            party = findParty(datum.party);
            if (party) {
              countData.counts.push({party: party, count: datum.freq});
            }
          }
        });

        if (i in app.charts) {
          app.charts[i].updateLegend(countData);
        }
      });

      dateLegendContainer
        .attr('transform', 'translate(' + (parseInt(app.activeSliderBlind.attr('x'), 10) + 41) + ', ' + d3.mouse(this)[1] + ')')
        .style('display', 'inline');

      dateLegendText.text(formatWeek(app.activeWeek));

      var dateLegendSize = dateLegendText.node().getBBox();

      dateLegendBackground.attr({
        transform: 'translate(0, 0)',
        width: dateLegendSize.width + 42,
        height: dateLegendSize.height + 10 + 14
      })
      .style('opacity', 0.7);
    });

    var dateLegendContainer = options.textContainer
      .append('g')
      .attr('class', 'date-legend-container')
      .style('display', 'none');

    var dateLegendBackground = dateLegendContainer.append('rect');

    var dateLegendText = dateLegendContainer.append('text')
      .attr('class', 'legend-date')
      .attr('transform', 'translate(10, 18)')
      .style('fill', '#FFFFFF')
      .style('font-weight', 'bold')
      .style('font-size', '12px');

    dateLegendContainer.append('text')
      .text('Click to view details')
      .attr('transform', 'translate(10, 31)')
      .style('fill', '#ccc')
      .style('font-style', 'italic');

    var dateLegendArrow = dateLegendContainer.append('path')
      .attr('d', 'M0 5 L5 0 L5 10z')
      .attr('transform', 'translate(-5, 16)')
      .style({
        'fill': '#000000',
        'opacity': 0.7
      });

  }

  function formatWeek(activeWeek){
    var parse = activeWeek.split('-');
    return 'Week ' + parse[1] + ' ' + parse[0];
  }

  function findParty(party){
    return _.detect(app.parties, function(p){ return p.name === party });
  }

}(window.app));
