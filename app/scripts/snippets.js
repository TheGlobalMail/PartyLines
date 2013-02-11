(function(app) {
  'use strict';

  var Snippets = window.Snippets = { maxSnippets: 50 };
  var _render = _.template(document.getElementById('snippets-template').innerHTML);

  var container      = $('#snippets');
  var outerContainer = $('#snippet-container');
  var furtherSearch  = $('#openau-further-search');
  var snippetsLink   = $('#snippet-link');

  snippetsLink.on('click', function(e){
    e.preventDefault();
    $.scrollTo('#snippet-container', 'slow');
  });

  Snippets.requestSnippets = function(){
    app.vent.trigger('snippetsRequested');
  };

  Snippets.loadSnippets = function() {
    // hansardIds is an array of CSV strings
    var ids = _.uniq(app.hansardIds.join(',').split(','))
                .slice(0, Snippets.maxSnippets).join(',');
    if (!ids) return;
    var endpoint = app.url + '/api/hansards';
    container.html('<div id="loading"><p>Loading...</p></div>');
    furtherSearch.empty();

    $.getJSON(endpoint, { ids: ids }, function(json) {
      _.each(json, function(hansard) {
        var $html = Snippets.render(hansard);
        // Highlight the keywords by wrapping in span with highlight class
        $html.find('.quotes-container').append(Snippets.buildQuotes(hansard));
        container.html($html);
      });

      if (json.length === Snippets.maxSnippets) {
        furtherSearch.append(Snippets.buildOpenAuFurtherSearch());
      }

      app.vent.trigger('snippetsLoaded');
    });
  };

  Snippets.render = function(data) {
    var $html = $(_render(data));
    return $html;
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
    html += '<a class="button" target="_BLANK" href="http://www.openaustralia.org/' + house + '/?id=';
    html += openauId +  '" title="View full speech at OpenAustralia">View in full</a>';
    html += '<br />';
    html += '<span class="sub">@openaustralia.org</span>'
    html += '</div>';
    return html;
  };

  Snippets.buildOpenAuFurtherSearch = function() {
    var html = [
      '<div class="openau-further-search-text">',
        '<h3 class="more-results-text">There are more results ',
          '(we only show the first ' + Snippets.maxSnippets + ')',
        '</h3>',
        '<h3 class="more-search-text">',
          'Do more complete searches at OpenAustralia',
        '</h3>',
        '<ul class="further-search-terms container">'
    ];

      _.each(app.terms, function(term) {
        html.push('<li><a class="button" target="_BLANK" href="http://www.openaustralia.org/search/?s=%22');
        html.push(encodeURIComponent(term) + '%22">&quot;' + _.escape(term) + '&quot;</a></li>');
      });

    html.concat([
        '</ul>',
      '</div>'
    ]);

    return html.join('');
  }

  app.vent.once('snippetsRequested', function() {
    outerContainer.show();
    snippetsLink.slideDown();
  });

  // hide snippets whenever new charts start loading
  app.vent.on('loading', function(state) {
    if (state === 'start') {
      outerContainer.hide();
      snippetsLink.hide();
    }
  });

}(app));
