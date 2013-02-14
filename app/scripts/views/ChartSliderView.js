(function(app, Backbone) {
  'use strict';

  var ChartSliderView = Backbone.View.extend({

    render: function(svg, options, charts) {
      renderSlider(svg, options, charts);
    }

  });

  function renderSlider(svg, options, charts) {
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

          if (i in charts) {
            charts[i].updateLegend(countData);
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

  app.Views.ChartSliderView = ChartSliderView;
}(app, Backbone));
