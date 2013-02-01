(function(){

  var Snippets = window.Snippets = {};

  Snippets.loadSnippets = function(){
    var ids = app.hansardIds.join(',').slice(0,60);
    if (!ids) return;
    var endpoint = app.url + '/api/hansards';
    $.ajax(endpoint, {
      data : {ids: ids},
      type : 'GET',
      dataType: 'json',
      success: function(json){
        var html = '';
        _.each(json, function(hansard){
          html += '<div id="speech">';
          html += '<h2>On ' + moment(hansard.date).format('DD/MM/YY HH:MM') + ' ' + hansard.speaker + ' said: </h2>';
          var speech = hansard.html;
          var partyData = _.detect(app.parties, function(party){ return party.name === hansard.party; });
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
  };

}());
