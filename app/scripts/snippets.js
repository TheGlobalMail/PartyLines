(function(app) {
  'use strict';

  var Snippets = window.Snippets = {};
  var _render = _.template(document.getElementById('snippets-template').innerHTML);
  var container = $('#snippets');

  Snippets.loadSnippets = function() {
    var ids = _.uniq(app.hansardIds.join(',').split(',')).slice(0,50).join(',');
    if (!ids) return;
    var endpoint = app.url + '/api/hansards';
    container.empty();
    $.getJSON(endpoint, { ids: ids }, function(json) {
      _.each(json, function(hansard) {
        var $html = Snippets.render(hansard);
        // Highlight the keywords by wrapping in span with highlight class
        $html.find('.quotes-container').append(Snippets.buildQuotes(hansard));
        container.append($html);
        app.vent.trigger('snippetsLoaded');
      });
    });
  };

  Snippets.render = function(data) {
    var html = _render(data);
    return $(html);
  };

  Snippets.buildQuotes = function(hansard) {
    var html = '', speech = hansard.html;
    var partyData = _.detect(app.parties, function(party) {
      return party.name === hansard.party;
    });

    speech = speech.replace(/<a.*?>(.*?)<\/a>/gim, '$1');

    _.each(app.terms, function(term, index) {
      if (term) {
        var searchTerm = term;
        var tokens = app.data[index].tokens;

        if (tokens) {
          searchTerm = _.map(tokens.split(' '), function(token){
            return token + '[a-z]*';
          }).join(' ');
        }

        var regex = '(^|[^a-zA-Z])(' + searchTerm + ')([^a-zA-Z]|$)';
        speech = speech.replace(
          RegExp(regex, 'gmi'),
          '<span style="background-color: ' + (partyData ? partyData.colour : '#333333') + '" class="highlight ' + hansard.party.replace(' ', '-').toLowerCase() + ' ">$2</span>'
        );
      }
    });

    var highlightedParas = _.select(speech.split('</p>'), function(p) { return p.match(/class="highlight/m); });

    _.each(highlightedParas, function(p) {
      html += '<blockquote>' + p;
      html += '</p></blockquote>';
    });

    html += this.buildOpenAuLink(hansard);

    return html;
  };

  Snippets.buildOpenAuLink = function(hansard){
    var match = hansard.id.match(/([^-]*)-(.*)/);
    var house = match[1] === 'house' ? 'debates' : 'senate';
    var openauId = match[2];
    var html = '<div class="openau-link">';
    html += '<a target="_BLANK" href="http://www.openaustralia.org/' + house + '/?id=';
    html += openauId +  '" title="View speech at OpenAustralia">View speech at OpenAustralia</a>';
    html += '</div>';
    return html;
  };

  app.vent.once('snippetsLoaded', function() {
    var $container = $('#snippet-container');
    var $link      = $('#snippet-link');

    $container.show();
    $link.slideDown();
  });

}(app));
