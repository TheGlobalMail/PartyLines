var app = {};

var url = "http://politalk-api.theglobalmail.org";
//var url = "http://localhost:8080";

// TODO: style svg paths with css
var parties = [
  {abbrev: 'DEM', name: 'Australian Democrats', colour: '#f3bf07'},
  {abbrev: 'GRN', name: 'Australian Greens', colour: '#33b26a'},
  {abbrev: 'ALP', name: 'Australian Labor Party', colour: '#e23c3f'},
  {abbrev: 'Country Lib', name: 'Country Liberal Party', colour: '#87b8da'},
  {abbrev: 'Democratic Lab', name: 'Democratic Labor Party', colour: '#f09d9f'},
  {abbrev: 'Family First', name: 'Family First Party', colour: '#ff835e'},
  {abbrev: 'IND', name: 'Independent', colour: '#b9b9b9'},
  {abbrev: 'LIB', name: 'Liberal Party', colour: '#1072b6'},
  {abbrev: 'NAT', name: 'National Party', colour: '#bd744d'}
];

var partyColours = d3.scale.ordinal()
  .domain(_.pluck(parties, 'name'))
  .range(_.pluck(parties, 'colour'));

app.terms = [];
app.data = [];

app.activeSliderBlind = null;
app.loadTimer = null;
app.activeWeek = null;

$(function(){
  loadData();
});

function loadData(){

  // Check the query string for up to four terms to do party lines for
  app.terms = [];
  app.complete = [];
  _.each(_.range(4), function(index){
    var n = index + 1;
    var keyword = getURLParameter('q' + n);
    var complete = getURLParameter('c' + n);
    if (keyword && keyword.match(/\w/)){
      app.terms.push(keyword);
      $('input[name="q'+ app.terms.length +'"]').val(keyword);
      app.complete.push(complete);
      $('input[name="c'+ app.complete.length +'"]').prop('checked', !!complete);
    }
  });

  // TODO bulk load this perhaps?
  $.getJSON(url + '/api/weeks', function(data){
    app.weeks = data;
    app.weeksIndex = _.object(data, _.range(data.length));

    $('#chart-container').append('<strong id="charts-loading" style="margin:0 auto">Loading charts</strong>');

    async.map(_.zip(app.terms, app.complete), function(termInfo, done){
      $.getJSON(url + '/api/wordchoices/term/' + termInfo[0], {c: termInfo[1]}, function(data){
        done(null, data);
      });
    }, function(err, results){
      $('#charts-loading').remove();
      app.data = results;
      renderCharts();
    });
  });
}

function renderCharts(){
  var margin = {top: 20, right: 10, bottom: 0, left: 30};
  var width = 900 - margin.left - margin.right;
  var individualChartHeight = 140;
  var height = individualChartHeight - margin.top - margin.bottom;
  var options = {
    margin: margin,
    width: width,
    height: height
  };

  app.charts = [];

  var svg = d3.select("#chart-container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", individualChartHeight * app.terms.length);

  // set up axis

  _.each(app.terms, function(term, i){
    options.index = i;
    if (app.data[i].message){
      $('#chart-container').append('<p class="error"><strong>' + app.data[i].message + "</strong>. Please try again and let us know if this message doesn't make sense.</p><br />");
    }else if (!app.data[i].data.length){
      $('#chart-container').append('<p class="error">No mentions of <strong>' + term + "</strong> found. Try a different term or search openaustralia.org for inspiration.</p><br />");
    }else{
      renderChart(svg, options, term, app.data[i].data);
    }
  });

  //renderLegend();

  renderSlider(svg, options);
}

function renderLegend(){
  var $legend = $('#legend tbody tr');
  _.each(parties, function(party){
    $legend.append(
      '<td style="background-color:'+party.colour+';width:12px;height:4px;">&nbsp;</td>' +
      '<td style="width:auto;padding:0 10px 0 6px;">' + party.abbrev + '</td>'
    );
  });
}

function getURLParameter(name){
  return decodeURIComponent(
    (RegExp(name + '=' + '([^&$#]+)').exec(location.search)||['',''])[1]
  ).replace(/\+/g, ' ');
}


function renderChart(svg, extraOptions, term, termData){
  var series = prepareSeries(termData);
  var max = findMax(series);
  var id = idFromTerm(term);
  var options = {id: id, svg: svg, series: series, max: max, term: term};
  options = _.extend(options, extraOptions);
  var chart = new Chart(options);
  app.charts.push(chart);
}

function prepareSeries(data){
  var series = [];
  var party = {};
  _.each(data, function(datum){
    if (datum.party !== party.name){
      if (party.name) series.push(party);
      party = {name: datum.party, data: []};
    }
    var weeksIndex = app.weeksIndex[datum.week];
    party.data.push({x: weeksIndex, y: datum.freq});
    lastWeekIndex = weeksIndex;
  });

  if (party.name) series.push(party);
  _.each(series, function(partyData){
    var filledSeries = [];
    var xPoints = _.pluck(partyData.data, 'x');
    _.each(app.weeks, function(week){
      var weekIndex = app.weeksIndex[week];
      var matchingIndex = xPoints.indexOf(weekIndex);
      if (matchingIndex === -1){
        filledSeries.push({x: weekIndex, y: 0});
      }else{
        filledSeries.push(partyData.data[matchingIndex]);
      }
    });
    partyData.data = filledSeries;
  });
  return series;
}

function findMax(series){
  var stackedYValues = [];
  _.each(series, function(party){
    _.each(party.data, function(datum, i){
      if (stackedYValues.length < i + 1){
        stackedYValues.push(datum.y);
      }else{
        stackedYValues[i] += datum.y;
      }
    });
  });
  return _.max(stackedYValues);
}

function idFromTerm(term){
  return term.toLowerCase().replace(/^\s/g, '_');
}

function Chart(options){
  this.options = options;
  this.svg = this.options.svg;
  this.series = this.options.series;
  this.id = this.options.id;
  this.chartContainer = this.svg.append("g")
    .attr('class','chart-' + this.options.index)
    .attr("transform", "translate(" + this.options.margin.left + "," + (this.options.height + 20) * this.options.index + ")");
  this.renderAxes();
  this.renderArea();
  this.renderTitle();
  this.renderLegend();
}

Chart.prototype.renderAxes = function(){
  this.xScale = d3.scale.ordinal()
    .rangeBands([0, this.options.width])
    .domain(app.weeks);
  this.yScale = d3.scale.linear()
    .range([this.options.height, 0])
    .domain([0, this.options.max]);

  this.xAxisTop = d3.svg.axis().scale(this.xScale).orient("bottom");
  this.xAxisBottom = d3.svg.axis().scale(this.xScale).orient("top");

  if(this.options.index === 0){
    this.chartContainer.append("g")
      .attr("class", "x axis top")
      .attr("transform", "translate(0,0)")
      .call(this.xAxisTop);
  }
  if (this.options.index === (app.terms.length - 1)){
    this.chartContainer.append("g")
      .attr("class", "x axis bottom")
      .attr("transform", "translate(0," + this.options.height + ")")
      .call(this.xAxisBottom);
  }
  this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(5);
  this.chartContainer.append("g")
    .attr("class", "y axis")
    //.attr("transform", "translate(-15,0)")
    .call(this.yAxis);
};

Chart.prototype.renderArea = function(){
  var xS = this.xScale;
  var yS = this.yScale;
  var area = this.area = d3.svg.area()
    .interpolate("step-after")
    .x(function(d) { return xS(d.x); })
    .y0(function(d){ return yS(d.y0); })
    .y1(function(d) { return yS(d.y0 + d.y); });
  this.stack = d3.layout.stack()
        .values(function(d) {
          return d.data;
        });
  this.parties = this.stack(this.series);
  this.party = this.chartContainer.selectAll(".party-" + this.id)
    .data(this.parties)
    .enter().append("g")
    .attr("class", "party-" + this.id);
  this.party.append("path")
    .attr("class", "area-" + this.id)
    .attr("transform", "translate(0,0)")
    .attr("d", function(d) {
      var r = area(d.data);
      return r;
    })
    .style("fill", function(d) { return partyColours(d.name); });
};

Chart.prototype.renderTitle = function(){
  this.chartContainer.append("text")
    .attr("class","graph-title")
    .attr("transform", "translate(15,25)")
    .text(this.options.term);
};

Chart.prototype.renderLegend = function(){
  this.legendDate = this.chartContainer.append("text")
    .attr("class","legend-date")
    .attr("transform", "translate(" + (this.options.width - 640) + ", 14)")
    .text('');
  this.legendCounts = this.chartContainer.append("text")
    .attr("class","legend-counts")
    .attr("transform", "translate(" + (this.options.width - 640) + ", 25)")
    .text('');
  this.legendCountsText = [];
};

Chart.prototype.updateLegend = function(data){
  var chart = this;
  this.legendDate.text(data.week);
  _.each(this.legendCountsText, function(s){ s.remove(); });
  _.each(data.counts, function(count, i){
    chart.legendCountsText.push(chart.legendCounts.append("tspan").style("fill", count.party.colour).text("▇ "));
    chart.legendCountsText.push(chart.legendCounts.append("tspan").text(count.party.abbrev));
    chart.legendCountsText.push(chart.legendCounts.append("tspan").text(': ' + count.count + '  '));
  });
};

function renderSlider(svg, options){
  var fullHeight = app.data.length * (options.height) + (app.data.length - 1) * (options.margin.top + options.margin.bottom) - options.margin.bottom;
  var data = _.map(app.weeks, function(){ return fullHeight; });
  var xScale = d3.scale.ordinal()
    .rangeBands([0, options.width])
    .domain(app.weeks);
  var yScale = d3.scale.linear()
    .range([fullHeight, 0])
    .domain([0, fullHeight]);
  var sliderContainer = svg.append("g")
    .attr('id','slider-container')
    .attr("transform", "translate(" + options.margin.left + ",0)");
  sliderContainer.selectAll("rect")
    .data(data)
    .enter().append("rect")
    .attr("x", function(d, i){ return xScale(i); })
    .attr("y", 0)
    .attr('class','slider-blind')
    .attr("width", xScale.rangeBand())
    .attr('data-week', function(d, i){
      return app.weeks[i];
    })
    .attr("height", fullHeight);

  var locked = false;

  $('rect.slider-blind').click(function(e){
    locked = !locked;
    if (!locked){
      $(this).trigger('mouseover');
    }
  });

  $('rect.slider-blind').mouseover(function(e){
    if (locked) return;
    var hansardIds = [];
    if (app.activeSliderBlind){
      app.activeSliderBlind.attr('class', 'slider-blind');
    }
    app.activeSliderBlind = $(this);
    app.activeSliderBlind.attr('class', 'slider-blind active');

    app.activeWeek = app.activeSliderBlind.data('week');
    _.each(app.data, function(termData, i){
      var countData = {
        week: formatWeek(app.activeWeek),
        counts: []
      };
      _.each(termData.data, function(datum){
        var party;
        if (datum.week === app.activeWeek && datum.freq > 0){
          party = findParty(datum.party);
          if (party){
            countData.counts.push({party: party, count: datum.freq});
            hansardIds.push(datum.ids);
          }
        }
      });
      app.charts[i].updateLegend(countData);
    });

    if (hansardIds.length){
      app.hansardIds = hansardIds;
      $('#snippets').html('<p>Loading...</p>');
      if (app.loadTimer) clearTimeout(app.loadTimer);
      app.loadTimer = setTimeout(loadSnippets, 2000);
    }
  });
}

function loadSnippets(){
  var ids = app.hansardIds.join(',');
  if (!ids) return;
  var endpoint = url + '/api/hansards';
  $.ajax(endpoint, {
    data : {ids: ids},
    type : 'POST',
    dataType: 'json',
    success: function(json){
      var html = '';
      _.each(json, function(hansard){
        html += '<div id="speech">';
        html += '<h2>On ' + moment(hansard.date).format('DD/MM/YY HH:MM') + ' ' + hansard.speaker + ' said: </h2>';
        var speech = hansard.html;
        var partyData = _.detect(parties, function(party){ return party.name === hansard.party; });
        speech = speech.replace(/<a.*?>(.*?)<\/a>/gim, '$1');
        _.each(app.terms, function(term){
          if (term){
            speech = speech.replace(
              RegExp('(^|[^a-zA-Z])(' + term + ')([^a-zA-Z]|$)', 'gmi'),
              '<span style="color: ' + (partyData ? partyData.colour : '#333333') + '" class="highlight ' + hansard.party.replace(' ', '-').toLowerCase() + '">$2</span>'
            );
          }
        });
        var highlightedParas = _.select(speech.split('</p>'), function(p){ return p.match(/class="highlight/m); });
        _.each(highlightedParas, function(p){
          html += '<blockquote>' + p + '</p></blockquote>';
        });
        html += '</div>';
      });
      $('#snippets').html(html);
    }
  });
}

function formatWeek(activeWeek){
  var parse = activeWeek.split('-');
  return 'Week ' + parse[1] + ' ' + parse[0];
}

function findParty(party){
  return _.detect(parties, function(p){ return p.name === party });
}
