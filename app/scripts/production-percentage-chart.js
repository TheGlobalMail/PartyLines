(function(_, $, d3) {
  'use strict';

  var colorMap = {
    'tan':    '#ece0c1',
    'orange': '#fd8939',
    'green':  '#1aab45',
    'brown':  '#d16326',
    'grey':   '#d4e2e1',
    'red':    '#f44858',
    'pink':   '#e9695b'
  }

  var data = [
    { name: 'Rice', percentage: 100, color: 'tan' },
    { name: 'Oranges', percentage: 95, color: 'orange' },
    { name: 'Grapes', percentage: 94, color: 'green', note: 'Drying, Table and Other' },
    { name: 'Almonds', percentage: 93, color: 'brown' },
    { name: 'Cotton Lint', percentage: 92, color: 'grey', image: 'cotton' },
    { name: 'Grapes', percentage: 74, color: 'green', note: 'Winemaking', image: 'wine' },
    { name: 'Tomatoes', percentage: 68, color: 'red' },
    { name: 'Pigs', percentage: 62, color: 'pink' },
    { name: 'Apples', percentage: 54, color: 'red' },
    { name: 'Wheat', percentage: 48, color: 'tan' }
  ];

  var $graph = $('#production-percentage-chart');

  function init(graphWidth) {
    $graph.empty();
    var totalRowHeight = 42;
    var barHeight = 14;
    graphWidth = graphWidth || 540;
    var imageWidth = 44;
    var graphHeight = totalRowHeight * data.length + 40;
    $graph.css('height', graphHeight);
    var graph = d3.select('#production-percentage-chart')
      .append('svg')
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
            return (graphWidth - imageWidth) * (d.percentage / 100);
          });
        }
      })
      .on('scrollout', function(e) {
        if (e.direction === 'up') {
          bars.attr('width', 0)
        }
      }).handleScroll();

    g.append('text')
      .attr({
        x: graphWidth,
        y: function(d, i) { return i * totalRowHeight + 14; },
        class: 'produce-percentage',
        width: 120,
        'text-anchor': 'end'
      })
      .text(function(d, i) { return d.percentage + '%' });


    // stores widths of labels for 'note' rendering
    var textWidths = [];

    // produce label
    g.append('text')
      .attr('y', function(d, i) { return i * totalRowHeight + 14; })
      .attr('x', imageWidth)
      .attr('class', 'produce-name')
      .text(yoink('name', function(t) { return t.toUpperCase(); }))
      .each(function(d) {
        if (d.note) {
          textWidths.push(this.getBBox().width);
        }
      });

    // product label note
    g.filter(function(d) { return d.note; }).append('text')
      .attr('y', function(d, i) { return _.indexOf(data, d) * totalRowHeight + 14; })
      .attr('x', function(d, i) { return imageWidth + textWidths[i] + 5; })
      .attr('class', 'produce-note')
      .text(function(d) { return '- ' + d.note.toUpperCase() });

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
}(_, jQuery, d3));
