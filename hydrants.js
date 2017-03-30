// hydrants.js - Javascript for displaying Cambridge MA tree map

/* NOTES: how long is a hose?
*	projection of buffer oval
* if user moves map before data is loaded - breaks?
*

*
*/

/**
* hydrants.js 0.1 March 2017
* @copyright (c) Milly Matthews-Mulroy
* @author Milly Matthews-Mulroy
* @version 0.1 March 2017
*
*/

/**
* make point buffer
* @param {number}	longitude - feature longitudinal coordinates
* @param {number}	latitude - feature latitudinal coordinates
*/
function makeBuffer(longitude, latitude) {

	// map centre point
	var mapCentre = {
		"type": "Feature",
		"properties": {},
		"geometry": {
			"type": "Point",
			"coordinates": [longitude, latitude]
		}
	};
	var unit = 'kilometers';

	// create 200 metre buffer
	var buffer = turf.buffer(mapCentre, 0.2, unit); //arguments: feature, radius, unit

	// return the buffer
	return(buffer);

}

/**
* point in polygon analysis to calculate nearest fire hydrants
* @param {object}	hydrants - hydrant data
* @param {object}	buffer - location point buffer
*/
function nearestHydrants (hydrants, buffer){
	// get points within buffer
	var ptswithin = turf.within(hydrants, turf.featureCollection([buffer])); //arguments: input points, input polygons
	return(ptswithin);

}

/**
* hydrant colour categories
* @param {number}	flowRate - Gallons Per Minute
*/
function hydrantColour(flowRate){

  if (flowRate > 1499){
    return 'blue';
  }
  else if (flowRate > 999 && flowRate < 1500){
    return 'green';
  }
  else if (flowRate > 649 && flowRate < 1000){
    return 'orange';
  }
  else if (flowRate > 449 && flowRate < 650){
    return 'red';
  }
  else {
    return 'black'; // < 450 GPM
  }
}

/**
* popup window for each feature
* @param {object}	feature - features
* @param {object}	layer - layer on map
*/
var onEachFeature = function (feature, layer) {

	//popup content
	var content = "<h3> Hydrant GPM : " + feature.properties.HYDRANT_GPM + "</h3>";
	layer.bindPopup(content);

}

/**
* geojson point data to leaflet layer
* @param {object}	feature - features
* @param {object}	latlng - feature latitude and longitude
*/
var pointToLayer = function (feature, latlng) {
	//get hydrant flow rate
	// style points
	var fc = hydrantColour(feature.properties.HYDRANT_GPM);
	var style = hydrantStyle(fc);
	return L.circleMarker(latlng, style)

}

/**
* symbology for hydrant features
* @param	{string}	fillColor colour
*/
var hydrantStyle = function(fillColor){

	var style = {
		radius: 7,
		fillColor: fillColor,
		color: "black",
		weight: 0,
		opacity: 1,
		fillOpacity: 1,
		pane: "pane1"
	};

	return style;

}

/**
* symbology for buffer feature
*/
var bufferStyle = function(){

	var style = {
		fillColor: "white",
		color: "white",
		weight: 1,
		opacity: 0,
		fillOpacity: 0.4,
		pane: "pane0"
	};

	return style;

}

/**
* symbology for location feature
*/
var locationStyle = function(){

	var style = {
		fillColor: "#00ffff",
		color: "white",
		weight: 5,
		opacity: 0.5,
		fillOpacity: 1,
		pane: "pane2",
		radius: 5

	}

	return style;
}

/**
* initialise  - main function
*/
function main(){

	// leaflet map instance
	var latlon =  new L.LatLng(42.3736, -71.1097); // cambridge
	var map = L.map('mapid').setView(latlon, 17); // initialise map

	//drawing order - leaflet panes
	var bufferPane = map.createPane("pane0");
	var hydrantsPane = map.createPane("pane1");
	var locationPane = map.createPane("pane2");

	// global variables
	var hydrantsLayer = null;
	var bufferLayer = null;
	var locationLayer = null;
	var hydrantsData = null;

	// mapbox basemap
	var tiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWlsbHltYXR0aGV3c211bHJveSIsImEiOiJjaXpzdW9zb2owM2JkMnFueTVva3M0ZjA5In0.IybFKf9Su38aWUDKDDmhcA', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
		maxZoom: 20,
		id: 'mapbox.streets',
	}).addTo(map);

	// user location
	map.locate({setView: true, maxZoom: 17});

	/**
	* locate user on the map
	*/
	function onLocationFound(e) {
		// remove the old layers
		if (locationLayer !== null){
			map.removeLayer(locationLayer);
		}
		// add user location to map
		locationLayer = L.circleMarker(e.latlng, locationStyle())
		locationLayer.addTo(map).bindPopup("You are here").openPopup();
	}

	map.on('locationfound', onLocationFound);

	// map controls
	var scale = L.control.scale({'position':'bottomleft', 'metirc':true}).addTo(map);
	var locationBox = L.control({'position':'topright'});
	var infoBox = L.control({'position':'topright'});

	// location button on map
	locationBox.onAdd = function (map) {
	    this._div = L.DomUtil.create('div', 'button'); // create a div with a class "button"
			this._div.innerHTML = '<div id="mylocation"><a href="#">My Location</a></div>';

			L.DomEvent.addListener(this._div, 'click', function(){map.locate({setView: true, maxZoom: 17})});

	    return this._div;

	};

	// add button
	locationBox.addTo(map);

	// info button on map
	infoBox.onAdd = function(map) {
		this._div = L.DomUtil.create('div', 'button'); // create a div with a class "button"
		this._div.innerHTML = '<div><a href="index.html">About Map</a></div>';
		return this._div;

	}
	 // add button
	infoBox.addTo(map);

	// map legend
	var legend = L.control({position: 'bottomright'});
	legend.onAdd = function (map) {

		// create legend box for hydrant points
    var div = L.DomUtil.create('div', 'info legend'),
				grades = [0, 450, 650, 1000, 1500],
        labels = [];

		div.innerHTML += 'Hydrant Flow Rate (GPM)<br>'
    // loop through colours and generate a label with a colored point for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<circle style="background:' + hydrantColour(grades[i] + 1) + '"></circle> ' +
            grades[i] + (grades[i + 1] ? ' &ndash; ' + grades[i + 1] + '<br>' : '+');
    }

    return div;

	};

	legend.addTo(map);

	/**
	* draw leaflet layers on map
	* @param {object}	nearestHydrants - nearest hydrant features
	* @param {object}	currentBuffer - buffer about map centre
	*/
	function newLayer(nearestHydrants, currentBuffer){
		// remove the old layers
		if (hydrantsLayer !== null){
			map.removeLayer(hydrantsLayer);
		}
		if (bufferLayer !== null){
			map.removeLayer(bufferLayer);
		}

		// add all data to map
		hydrantsLayer = L.geoJSON(nearestHydrants,{
			onEachFeature: onEachFeature,
			pointToLayer: pointToLayer
		});
		hydrantsLayer.addTo(map);

		bufferLayer = L.geoJSON(currentBuffer, {
			style: bufferStyle()
		});
		bufferLayer.addTo(map); //add to map

	}

	/**
	* initialise hydrants
	* @param {object}	hydrants - hydrant features
	*/
	function init(hydrants){
		// first, store the hydrants
		hydrantsData = hydrants;
		// second, get the buffer
		var buffer = makeBuffer(-71.1097, 42.3736);
		// third, point in polygon
		var nearHydrants = nearestHydrants(hydrantsData, buffer);
		// draw layers
		newLayer(nearHydrants, buffer);

	}

	// load json-encoded data from server
	$.getJSON("https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/master/Infra/Hydrants/INFRA_Hydrants.geojson", 		function(data) {
		console.log(data);

		init(data);

	});

	// on map move, get centre coordinates
	map.on('moveend', function(e) {
		var coordinates = map.getCenter();

		// draw buffer about map centre
		var buffer = makeBuffer(coordinates.lng, coordinates.lat);

		// calculate nearest hydrants
		var nearHydrants = nearestHydrants(hydrantsData, buffer);

		// draw layers
		newLayer(nearHydrants, buffer);

	 });
}
