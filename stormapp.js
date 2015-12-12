Markers = new Mongo.Collection('markers');

if (Meteor.isClient) { var _dep = new Deps.Dependency(); var uid=""; Template.map.onCreated(function() { GoogleMaps.ready('map', function(map) { google.maps.event.addListener(map.instance, 'click', function(event) { // console.log(this); });

  var markers = {};

  Markers.find().observe({
    added: function (document) {

    var marker = new google.maps.Marker({
      draggable: false,
      animation: google.maps.Animation.DROP,
      position: new google.maps.LatLng(document.lat, document.lng),
      map: map.instance,
      id: document._id
    });

    google.maps.event.addListener(marker, 'click', function(event) {
      var a = Markers.find({_id: marker.id}).fetch();
      alert(a[0].name+' needs assistance.')
    });

      markers[document._id] = marker;
    },
    changed: function (newDocument, oldDocument) {
      markers[newDocument._id].setPosition({ lat: newDocument.lat, lng: newDocument.lng });
    },
    removed: function (oldDocument) {
      markers[oldDocument._id].setMap(null);
      google.maps.event.clearInstanceListeners(markers[oldDocument._id]);
      delete markers[oldDocument._id];
    }
  });
});
});

Meteor.startup(function() { GoogleMaps.load({ key:"AIzaSyBviRmxq5LJONieeGvcLHNZAcyefM07GtU", libraries: 'places' // also accepts an array if you need more than one }); $.getScript("https://rawgit.com/urin/jquery.balloon.js/master/jquery.balloon.js"); });

Template.map.helpers({ mapOptions: function() { if (GoogleMaps.loaded()) { return { center: new google.maps.LatLng(33.7550, -84.3900), zoom: 8 }; } } });

Template.Data.helpers({ getmarkers:function(){ _dep.depend(); if(jQuery.isEmptyObject(uid)){ return Markers.find();
}else{ return Markers.find({_id: uid}); }

}
});

Template.Data.events({ 'click .remove' : function () { uid=""; _dep.changed(); } });

Template.topnav.events({ 'click #weat':function(e,t){ e.preventDefault(); Meteor.call("checkWeather", function(error, results) { for(var i=0;i<results.data.forecasts.length;i++){ if(results.data.forecasts[i].severity=="1"){ if(i==0){ alert('It is safe to be outside sheltered area now.'); break; }else{ alert('It will be safe to be outside sheltered area after '+(i)+' hour(s).'); break; } } } }); } });

Template.helpme.onRendered(function() { // this.$("#address").geocomplete(); this.autorun(function () { Geolocation.latLng(); if (GoogleMaps.loaded()) { $("#address").geocomplete(); } }); });

Router.configure({ // the default layout layoutTemplate: 'topnav' });

Router.route('/', function () { // set the layout programmatically this.layout('topnav');

// render the PageOne template this.render('Data'); this.render('helpme');

// this.render('map'); });

Router.route('/data', function () { this.layout('topnav'); this.render('Data'); });

Router.route('/weather', function () { this.layout('topnav'); this.render('Weather'); });

Template.Weather.created = function () { this.autorun(function () { Meteor.call("checkWeather", function(error, results) { for(var i=0;i<results.data.forecasts.length;i++){ if(results.data.forecasts[i].severity=="1"){ if(i==0){ alert('It is safe to leave your current location.');

        }else{
          alert('It will be safe to leave your location after '+(2*(i+1))+' hours.');
          break;
        }
      }
    }
});
});
};

Template.Data.created = function () { this.autorun(function () { var instance = EasySearch.getComponentInstance( { index : 'markers' } );

instance.on('autosuggestSelected', function (values) {
  // run every time the autosuggest selection changes
  console.log(values);
  if(!jQuery.isEmptyObject(values)){
    // var found = filterArray.some(function (el) {
    //   return (el.id == values[values.length-1].id);
    // });
    // if (!found) { 
    //   filterArray.push(values[values.length-1]); 
    //   _dep.changed();
    // }
    uid=values[values.length-1].id;
    _dep.changed();
  }
});
}); };

Template.helpme.events({ 'click #here':function(e,t){ var loc = t.find('#address').value; var name = t.find('#name').value; var num = t.find('#noofpeople').value; var special = t.find('#special').value; if(Geolocation.error()){ Meteor.call('getlatlng',loc, name, num, special); }else{ var blah = Geolocation.latLng(); Meteor.call('getaddress',blah.lat, blah.lng, name, num, special); } } }); }

EasySearch.createSearchIndex('markers', { field: 'special', collection: Markers, use: 'mongo-db', query: function (searchString, opts) { // Default query that is used for searching var query = EasySearch.getSearcher(this.use).defaultQuery(this, searchString);

return query;
} });

if (Meteor.isServer) { Meteor.methods({ checkWeather: function () { this.unblock(); return Meteor.http.call("GET", "http://api.weather.com/v1/geocode/34.063/-84.217/forecast/hourly/48hour.json?apiKey=34aae6773a01ce1756979f510dff96b9&language=en-US&units=e"); } }); }
