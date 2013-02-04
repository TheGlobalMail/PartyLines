(function() {

  $(function(){
    app.loadData();
  });

  var app = window.app = {

    url: "http://partylines-api.theglobalmail.org",
    //url: "http://localhost:8080",
    //url: "http://10.8.1.81:8080",

    parties: [
      {abbrev: 'DEM', name: 'Australian Democrats', colour: '#f3bf07'},
      {abbrev: 'GRN', name: 'Australian Greens', colour: '#33b26a'},
      {abbrev: 'ALP', name: 'Australian Labor Party', colour: '#e23c3f'},
      {abbrev: 'Country Lib', name: 'Country Liberal Party', colour: '#87b8da'},
      {abbrev: 'Democratic Lab', name: 'Democratic Labor Party', colour: '#f09d9f'},
      {abbrev: 'Family First', name: 'Family First Party', colour: '#ff835e'},
      {abbrev: 'IND', name: 'Independent', colour: '#b9b9b9'},
      {abbrev: 'LIB', name: 'Liberal Party', colour: '#1072b6'},
      {abbrev: 'NAT', name: 'National Party', colour: '#bd744d'}
    ],

    terms: [],
    data: [],
    activeSliderBlind: null,
    loadTimer: null,
    activeWeek: null
  };


  app.loadData = function(){

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

    // TODO bulk load? Make the graph loading fulling async
    $.getJSON(app.url + '/api/weeks?callback=?', function(data){
      app.weeks = data;
      app.weeksIndex = _.object(data, _.range(data.length));

      $('#chart-container').append('<strong id="charts-loading" style="margin:0 auto">Loading charts</strong>');

      async.map(_.zip(app.terms, app.complete), function(termInfo, done){
        $.getJSON(app.url + '/api/wordchoices/term/' + termInfo[0] + '?callback=?', {c: termInfo[1]}, function(data){
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

    renderSlider(svg, options);
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
        app.loadTimer = setTimeout(Snippets.loadSnippets, 2000);
      }
    });
  }

  function formatWeek(activeWeek){
    var parse = activeWeek.split('-');
    return 'Week ' + parse[1] + ' ' + parse[0];
  }

  function findParty(party){
    return _.detect(app.parties, function(p){ return p.name === party });
  }

}());
