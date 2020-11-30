// Adding a tile layers
var light = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
  tileSize: 512,
  maxZoom: 18,
  zoomOffset: -1,
  id: "mapbox/light-v10",
  accessToken: API_KEY
});

var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
  tileSize: 512,
  maxZoom: 18,
  zoomOffset: -1,
  id: "mapbox/satellite-streets-v11",
  accessToken: API_KEY
});

var outdoor = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
  tileSize: 512,
  maxZoom: 18,
  zoomOffset: -1,
  id: "mapbox/outdoors-v11",
  accessToken: API_KEY
});

// create tile gruop dictionary
var baseMaps = {
  Grayscale: light,
  Outdoors: outdoor,
  Satellite: satellite
}

// URL of earthquake data
quakesURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_week.geojson";

// list of colors to use for markers
var colors = ["rgb(0,255,0)","rgb(85,255,0)","rgb(170,255,0)","rgb(255,170,0)","rgb(255,85,0)","rgb(255,0,0)"]

// call api and run mapping function
d3.json(quakesURL, buildMap)

// mapping function
function buildMap(response) {
  // log response
  console.log(response);
  // instanciate array of markers
  circleList = []
  // loop through all rows and create circle markers
  for (i=0; i<response.features.length; i++) {
    // store row data
    quake = response.features[i];
    // store coordinates
    coords = quake.geometry.coordinates;
    // store magnitude
    magnitude = quake.properties.mag;
    // location description
    place = quake.properties.place;    
    
    // build marker
    var circle = L.circle([coords[1],coords[0]], {
            color: "black",
            weight: 1,
            // use circleFormatter function to define fill color
            fillColor: circleFormatter(magnitude)[1],
            fillOpacity: ".75",
            // use circleFormatter function to define circle radius
            radius: circleFormatter(magnitude)[0]
          })
    // add popup marker
    .bindPopup(`Magnitude: ${magnitude}<hr>${place}`);
    // add to circle list
    circleList.push(circle);
  };

  // crate earthquake marker overlay
  var quakesLayer = L.layerGroup(circleList)

  // map faultines
  // store url
  var platesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"
  
  // add faultlines to map  
  // instantiate variables
  var faultLines;
  var overlays;
  var myMap;
  // call api of faultline objects
  d3.json(platesURL, response => {
    // save line objects
    faultLines = L.geoJson(response, {style: {
                          color: "yellow",
                          weight: 1
                        }})
    
    // create overlays list  
    overlays = {
      Earthquakes: quakesLayer,
      "Fault Lines": faultLines
    };
  
    // Creating our initial map object
    myMap = L.map("map", {
      center: [20, 0],
      zoom: 2,
      layers: [satellite, quakesLayer, faultLines]
    });
    
    // create tile/overlay controls
    L.control.layers(baseMaps,overlays, {collapsed: false}).addTo(myMap);
    //call function to build the map legend
    buildLegend(myMap);   
  })
}

// Function to create the map legend
function buildLegend(mapObject) {
  // create legend object
  var legend = L.control({ position: "bottomright" });
  // add legend content
  legend.onAdd = function() {
    // create div to hold legend
    var div = L.DomUtil.create("div", "info legend");
    // create list of legend labels
    var mags = ["0-1","1-2","2-3","3-4","4-5","5+"];
    // instatiate array of color bar html code
    var colorBars = [];
    // instatiate array of labels html code
    var magLabels = [];
    
    // for each magnitude range...
    mags.forEach(function(mag, index) {      
      // add to array of color bar list item code
      colorBars.push(`<li style=\"background-color: ${colors[index]}"\></li>`);
      // add to array of label list item code
      magLabels.push(`<li>${mags[index]}</li>`)
    });
    // store html code for color bar ul
    var colorsHTML = `<ul>\
                        ${colorBars.join("")}\
                      </ul>`
    // store html code for labels ul  
    var labelsHTML = `<ul>\
                        ${magLabels.join("")}\
                      </ul>`

    // create container with columns for the color bars and labels
    var legendInfo = `<div class="container">\
                        <div class="row">\
                          <div class="col-md-6">\
                            ${colorsHTML}\
                          </div>\
                          <div class="col-md-6">\
                            ${labelsHTML}\
                          </div>
                        </div>
                      </div>`

    // add completed html code to the legend object
    div.innerHTML = legendInfo;

    return div;
  };
  // add legend to the map
  legend.addTo(mapObject);
}

// function for dynamically formatting earthquake markers
function circleFormatter(mag) {
  // define cicle radius based on earthquake magnitude (magnitude^3 x 2500px)
  var circleRadius = Math.pow(mag,3)*2500
  
  // define cicle color based in earthquake magitude
  if (mag<1) {
    circleColor = colors[0]
  } else if (mag<2) {
    circleColor = colors[1]
  } else if (mag<3) {
    circleColor = colors[2]
  } else if (mag<4) {
    circleColor = colors[3]
  } else if (mag<5) {
    circleColor = colors[4]
  } else {
    circleColor = colors[5]
  }
  // create array and return the results
  var circleFormat = [circleRadius, circleColor]
  return circleFormat
}