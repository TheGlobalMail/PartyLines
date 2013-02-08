(function(d3) {
  'use strict';

  function Chart(options) {
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
  };

  Chart.prototype.renderAxes = function() {
    this.xScale = d3.scale.ordinal()
      .rangeBands([0, this.options.width])
      .domain(app.weeks);

    this.yScale = d3.scale.linear()
      .range([this.options.height - 40, 0])
      .domain([0, this.options.max]);

    this.xAxisTop = d3.svg.axis().scale(this.xScale).orient("bottom");
    this.xAxisBottom = d3.svg.axis().scale(this.xScale).orient("top");

    if (this.options.index === 0) {
      this.chartContainer.append("g")
        .attr("class", "x axis top")
        .attr("transform", "translate(0,0)")
        .call(this.xAxisTop);
    }

    if (this.options.index === (app.terms.length - 1)) {
      this.chartContainer.append("g")
        .attr("class", "x axis bottom")
        .attr("transform", "translate(0," + (this.options.height) + ")")
        .call(this.xAxisBottom);
    }

    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(5);
    this.chartContainer.append("g")
      .attr("class", "y axis")
      .attr('transform', 'translate(0, 40)')
      .call(this.yAxis);
  };

  Chart.prototype.renderArea = function() {
    var xS = this.xScale;
    var yS = this.yScale;
    var area = this.area = d3.svg.area()
      .interpolate("step-after")
      .x(function(d) { return xS(d.x); })
      .y0(function(d){ return yS(d.y0); })
      .y1(function(d) { return yS(d.y0 + d.y); });

    this.stack = d3.layout.stack().values(function(d) { return d.data; });
    this.parties = this.stack(this.series);

    this.party = this.chartContainer.selectAll(".party-" + this.id)
      .data(this.parties)
      .enter().append("g")
      .attr('transform', 'translate(0, 40)')
      .attr("class", "party-" + this.id);

    var partyColours = d3.scale.ordinal()
      .domain(_.pluck(app.parties, 'name'))
      .range(_.pluck(app.parties, 'colour'));

    this.party.append("path")
      .attr("class", "area-" + this.id)
      .attr("transform", "translate(0,0)")
      .attr("d", function(d) { return area(d.data); })
      .style("fill", function(d) { return partyColours(d.name); });
  };

  Chart.prototype.renderTitle = function() {
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
    this.legendDate.text(data.week);
    _.invoke(this.legendCountsText, 'remove');

    _.each(data.counts, function(count, i){
      this.legendCountsText.push(this.legendCounts.append("tspan").style("fill", count.party.colour).text("▇ "));
      this.legendCountsText.push(this.legendCounts.append("tspan").text(count.party.abbrev));
      this.legendCountsText.push(this.legendCounts.append("tspan").text(': ' + count.count + '  '));
    }, this);
  };

  window.Chart = Chart;

}(d3));
