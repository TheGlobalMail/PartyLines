(function(app, Backbone) {
  'use strict';
  var lastTouchMove = false;

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
      .style('-webkit-user-select', 'none')
      .attr("transform", "translate(" + (options.margin.left+1) + "," + (options.margin.superTop - options.margin.topXAxisMargin) + ")")
      .attr('height', fullHeight);

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
      .on('mousemove', function(e) {
        if (lastTouchMove) {
          return false;
        }
        explore(this, true);
      })
      .on('mousedown', function(e) {
        if (lastTouchMove) {
          return false;
        }
        select($(this));
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
      .style('font-style', 'italic')
      .attr('class', 'date-action-text');

    var dateLegendArrow = dateLegendContainer.append('path')
      .attr('d', 'M0 5 L5 0 L5 10z')
      .attr('transform', 'translate(-5, 16)')
      .style({
        'fill': '#000000',
        'opacity': 0.7
      });

    svg.on('touchstart', function() {
        var e = d3.event;

        if (e.touches.length === 1) {
          var touch = e.touches[0];

          lastTouchMove = {
            touch: {
              pageX: touch.pageX,
              pageY: touch.pageY
            }
          };

          explore(touch.target, true, true, true);
        }
      })
      .on('touchmove', function() {
        var e = d3.event;

        if (!lastTouchMove || e.changedTouches.length !== 1) {
          return true;
        }

        var touch = e.changedTouches[0];
        var dx = Math.abs(touch.pageX - lastTouchMove.touch.pageX);
        var dy = Math.abs(touch.pageY - lastTouchMove.touch.pageY);
        var delta = dx - dy;
        lastTouchMove.touch = { pageX: touch.pageX, pageY: touch.pageY };

        if (delta < -3) {
          return true;
        }

        var target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!target || (target && !target.getAttribute('data-week'))) {
          console.log(target);
          return;
        }

        explore(target, true, true, true);
        lastTouchMove.target = target;

        e.preventDefault();
        return false;
      })
      .on('touchend', function() {
        var target;

        if ('target' in lastTouchMove) {
          target = lastTouchMove.target;
        } else {
          target = d3.event.target;
        }

        explore(target, true, -1);
        select($(target));
      });

    function select(selection) {
      var hansardIds = [];
      if (app.selectedSliderBlind){
        app.selectedSliderBlind.attr('class', 'slider-blind');
      }

      app.selectedSliderBlind = selection;
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
      }else{
        Snippets.showNoData();
      }
    }

    function explore(exploredBlind, updateClass, touch, hidePartyData) {
      if (updateClass && app.activeSliderBlind && app.activeSliderBlind.attr('class')) {
        if (app.activeSliderBlind.attr('class').match(/selected/)) {
          app.activeSliderBlind.attr('class', 'slider-blind selected');
        } else {
          app.activeSliderBlind.attr('class', 'slider-blind');
        }
      }

      app.activeSliderBlind = $(exploredBlind);

      if (updateClass && !app.activeSliderBlind.attr('class').match(/selected/)) {
        app.activeSliderBlind.attr('class', 'slider-blind active');
      }

      app.activeWeek = app.activeSliderBlind.data('week');

      if (!hidePartyData) {
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
      }

      var y = 0;
      var x = 0;

      if (touch) {
        if (touch === -1) { // touchend
          dateLegendContainer.style('display', 'none');
          return;
        }
        var touches = d3.touches(exploredBlind);

        if (touches.length) {
          y = touches[0][1];
        }

        dateLegendContainer.select('.date-action-text').text('Release to view details');
        x = parseInt(app.activeSliderBlind.attr('x'), 10) + 57
      } else {
        y = d3.mouse(exploredBlind)[1];
        x = parseInt(app.activeSliderBlind.attr('x'), 10) + 41;
      }

      dateLegendContainer
        .attr('transform', 'translate(' + x + ', ' + y + ')')
        .style('display', 'inline');

      dateLegendText.text(formatWeek(app.activeWeek));

      var dateLegendSize = dateLegendText.node().getBBox();

      dateLegendBackground.attr({
        transform: 'translate(0, 0)',
        width: dateLegendSize.width + 42,
        height: dateLegendSize.height + 10 + 14
      })
      .style('opacity', 0.7);
    }
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
