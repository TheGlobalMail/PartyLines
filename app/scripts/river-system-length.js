(function(d3, _, $, accounting) {
  'use strict';

  var data = [
    { name: 'Murray-Darling River Systems', length: 3672, color: 'blue' },
    { name: 'Rio-Grande', location: 'USA/Mexico', length: 3057, color: 'green' },
    { name: 'Danube-Breg', location: 'Europe', length: 2888, color: 'orange' },
    { name: 'Zambesi', location: 'Africa', length: 2693, color: 'yellow' }
  ];

  var $graph = $('#length-graph-container').empty();
  var totalBarHeight = 65;
  var max = _.chain(data).pluck('length').max().value();

  var yoink = function(prop, fn) {
    fn = fn || function(d) { return d; };
    return function(data) { return fn(data[prop]); };
  }

  var init = function(graphWidth) {
    $graph.empty();
    graphWidth = graphWidth || 540;

    var x = function(prop) {
      var scale = d3.scale.linear()
        .domain([0, max])
        .range([0, graphWidth]);

      return function(data) {
        return scale(data[prop])
      }
    }

    var graph = d3.select('#length-graph-container')
      .append('svg')
      .attr('width', graphWidth)
      .attr('height', data.length * totalBarHeight);

    var g = graph.selectAll('g').data(data).enter().append('g');

    // bar background pattern
    graph.append('defs').append('svg:pattern')
      .attr({ id: 'barstripesbackground', height: 1, width: 1 })
      .append('image')
        .attr('xlink:href', '/images/bar-stripes.png')
        .attr('height', 30)
        .attr('width', 700)
        .attr('x', 0).attr('y', 0);

    // bar background
    g.append('rect')
      .attr('y', function(d, i) { return i * totalBarHeight + (totalBarHeight - 20); })
      .attr('width', graphWidth)
      .attr('height', 20)
      .attr('fill', 'url(#barstripesbackground)');

    // bars
    var bars = g.append('rect')
      .attr('y', function(d, i) { return i * totalBarHeight + (totalBarHeight - 20); })
      .attr('width', 0)
      .attr('height', 20)
      .attr('class', yoink('color'));

    $graph.scrollWatch({ delay: 200 })
      .on('scrollin', function(e) {
        if (bars.attr('width') == 0) {
          bars.transition().ease('cubic-out').attr('width', x('length'));
        }
      })
      .on('scrollout', function(e) {
        if (e.direction === 'up') {
          bars.attr('width', 0);
        }
      }).handleScroll();

    var textWidths = [];

    // length text
    g.append('text')
      .attr('y', function(d, i) { return i * totalBarHeight + 40; })
      .attr('x', graphWidth)
      .attr('text-anchor', 'end')
      .attr('class', 'length')
      .text(yoink('length', function(l) { return accounting.formatNumber(l) + "km" }))
      .each(function(d, i) {
        if (i === 0) {
          this.setAttribute('class', this.getAttribute('class') + " first");
        }
      });

    // river system names
    g.append('text')
      .attr('y', function(d, i) { return i * totalBarHeight + 40 })
      .attr('x', 0)
      .attr('class', 'name')
      .text(yoink('name', function(t) { return t.toUpperCase(); }))
      .each(function(d, i) {
        textWidths[i] = this.getBBox().width;
      });

    // location
    g.append('text')
      .filter(function(d) { return d.location; })
      .attr('y', function(d, i) { return (i+1) * totalBarHeight + 40 })
      .attr('x', function(d, i) { return textWidths[i+1] + 5; })
      .attr('class', 'location')
      .text(yoink('location', function(t) { return '(' + t.toUpperCase() + ')'; }));
  };

  var render = _.debounce(function() {
    $graph.scrollWatch('destroy');
    init($graph.width());
  }, 200)

  init($graph.width());

  if (!window.isMobileSafari) {
    $(window).on('resize', render);
  }

  $(window).on('orientationchange', render);

  return init;
}(d3, _, jQuery, accounting));
