(function(_, $, d3, accounting) {
  'use strict';

  var colorMap = {
    'blue': '#2c80c1',
    'grey': '#d4e2e1'
  }

  var data = [
    { name: 'Cotton', amount: 1882243, color: 'grey' },
    { name: 'Grazing Pasture And Crops To Feed Livestock', amount: 1502567, color: 'blue', image: 'sheep' },
    { name: 'Rice', amount: 766195, color: 'grey' }
  ];

  var $graph = $('#livestock-water-use-chart');

  function init(graphWidth) {
    $graph.empty();
    graphWidth = graphWidth || 540;

    var totalRowHeight = 40;
    var barHeight = 14;
    var imageWidth = 44;
    var max = _.chain(data).pluck('amount').max().value();
    var graphHeight = totalRowHeight * data.length + 40;

    $graph.css('height', graphHeight);
    var graph = d3.select('#livestock-water-use-chart')
      .append('svg')
      .attr('class', 'bar-graph')
      .attr('width', graphWidth)
      .attr('height', graphHeight);

    var yoink = function(prop, fn) {
      fn = fn || _.identity;
      return function(data) { return fn(data[prop]); };
    };

    var barY = function(d, i) { return i * totalRowHeight + 18; };
    var g = graph.selectAll('g').data(data).enter().append('g');

    g.append('image')
      .attr('xlink:href', function(d) {
        return '/images/graph-icons/' + (d.image || d.name.toLowerCase()) + '.svg';
      })
      .attr('x', 3)
      .attr('y', function(d, i) { return i * totalRowHeight + 4; })
      .attr('width', imageWidth - 7)
      .attr('height', totalRowHeight - 8);

    // bar background
    g.append('rect')
      .attr('y', barY)
      .attr('x', imageWidth)
      .attr('width', graphWidth - imageWidth)
      .attr('height', barHeight)
      .attr('fill', 'url(#barstripesbackground)');

    g.append('text')
      .attr({
        y: function(d, i) { return i * totalRowHeight + 14 },
        x: graphWidth,
        'text-anchor': 'end',
        class: 'bar-amount',
        style: function(d, i) { return i === 0 ? 'font-weight: bold' : ''; }
      })
      .text(function(d) { return accounting.formatNumber(d.amount) + " ML"; });

    var bars = g.append('rect')
      .attr('y', barY)
      .attr('x', imageWidth)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('fill', function(d) { return colorMap[d.color]; });

    // animate bars when scrolled into viewport
    $graph.scrollWatch({ delay: 200 })
      .on('scrollin', function(e) {
        if (bars.attr('width') == 0) {
          bars.transition().ease('cubic-out').attr('width', function(d, i) {
            return (graphWidth - imageWidth) * (d.amount / max);
          });
        }
      })
      .on('scrollout', function(e) {
        if (e.direction === 'up') {
          bars.attr('width', 0)
        }
      }).handleScroll();

    // produce label
    g.append('text')
      .attr('y', function(d, i) { return i * totalRowHeight + 14; })
      .attr('x', imageWidth)
      .attr('class', 'bar-label')
      .text(yoink('name', function(t) { return t.toUpperCase(); }));
  }

  var render = _.debounce(function() {
    $graph.scrollWatch('destroy');
    init($graph.width());
    $graph.scrollWatch().handleScroll();
  }, 200)

  init($graph.width());

  if (!window.isMobileSafari) {
    $(window).on('resize', render);
  }

  $(window).on('orientationchange', render);
}(_, jQuery, d3, accounting));
