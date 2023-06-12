function loginfo(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #78d6fa; border-radius:10px;",
    ...str
  );
}
function logmarker(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #9300fc; border-radius:10px;",
    ...str
  );
}
function logland(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #0c7700; border-radius:10px;",
    ...str
  );
}
function logoccupation(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #B22222; border-radius:10px;",
    ...str
  );
}

function onMapClick(e) {
  loginfo("click on:", e.latlng.toString());
}

window.onload = async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const projection = params.projection || "globe";
  const mapId = params.id || "worldMap";

  let mapDataFromId = (
    await (
      await fetch(
        `https://raw.githubusercontent.com/CIMEngine/MapList/main/index.json`
      )
    ).json()
  )[mapId];

  const geoURL = params.geoURL || mapDataFromId.geoURL;
  const countryInfoUrl = params.countryInfoURL || mapDataFromId.countryInfoURL;

  mapboxgl.accessToken =
    "pk.eyJ1IjoiYXJ0ZWdvc2VyIiwiYSI6ImNrcDViN3BhcDAwbW0ydnBnOXZ0ZzFreXUifQ.FIVtaBNr9dr_TIw672Zqdw";
  let movc = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/artegoser/clfm612fg002601nlcika2018?optimize=true",
    center: [53.19, 41.28],
    zoom: 3,
    projection: projection,
  });

  let converter = new showdown.Converter();

  movc.on("load", async () => {
    movc.loadImage(
      "https://cimengine.github.io/map/icons/city.png",
      (error, image) => {
        if (error) throw error;
        movc.addImage("city", image);
      }
    );

    movc.loadImage(
      "https://cimengine.github.io/map/icons/capital.png",
      (error, image) => {
        if (error) throw error;
        movc.addImage("capital-city", image);
        movc.addImage("capital", image);
      }
    );

    movc.loadImage(
      "https://cimengine.github.io/map/icons/landmark.png",
      (error, image) => {
        if (error) throw error;
        movc.addImage("landmark-0", image);
      }
    );

    let lasticocords;

    loginfo("Getting geo data");
    let geo = await fetch(geoURL);
    loginfo("Getting country data");
    let coarray = await fetch(countryInfoUrl);
    coarray = await coarray.json();
    let countries = {};
    for (let i = 0; i < coarray.length; i++)
      countries[coarray[i].idc] = coarray[i];

    let geojson = await geo.json();

    movc.addSource("map-data", {
      type: "geojson",
      data: geojson,
    });

    movc.addLayer({
      id: "map-data-fill",
      type: "fill",
      source: "map-data",
      paint: {
        "fill-color": ["get", "fill"],
        "fill-opacity": ["coalesce", ["get", "fill-opacity"], 0.3],
      },
    });

    movc.addLayer({
      id: "map-data-fill-outline",
      type: "line",
      source: "map-data",
      paint: {
        "line-color": ["coalesce", ["get", "stroke"], "#0c7700"],
        "line-width": 2,
        "line-opacity": 0.8,
      },
    });

    movc.addLayer({
      id: "map-data-symbol",
      type: "symbol",
      source: "map-data",
      layout: {
        "icon-image": ["get", "type"],
        "icon-size": 0.15,
      },
      minzoom: 3,
    });

    movc.on("click", "map-data-fill", (e) => {
      const coordinates = e.lngLat;
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      onEachFeature(e.features[0], coordinates);
    });

    movc.on("click", "map-data-symbol", (e) => {
      const coordinates = e.lngLat;
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      onEachFeature(e.features[0], coordinates);
    });

    function onEachFeature(feature, coordinates) {
      if (feature.geometry.type === "Point") {
        lasticocords = coordinates;
        return new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `
                ${
                  feature?.properties?.amount
                    ? `<div class="row glass" style="color: "white";"><div class="col">Population - ${feature.properties.amount} people.</div></div>`
                    : ""
                }
                <div class="row" style="padding: 5px;">
                  ${
                    feature?.properties?.img
                      ? `<div class="col-md-12 col-sm-12" style="padding: 0px;"><img class="w-100 about-img" src="${feature.properties.img}" alt="${feature.properties.name} img"></div>`
                      : ""
                  }
                  <div class="col-md-12 col-sm-12 text-center glass mb-2">
                    <h5 className="card-title">${feature.properties.name}
                      ${
                        feature.properties.name_ru
                          ? ` - ${feature.properties.name_ru}`
                          : ""
                      }
                    </h5>
                  </div>
                  ${
                    feature.properties.description
                      ? `<div class="col-md-12 col-sm-12 text-center glass"><div>${converter.makeHtml(
                          feature.properties.description
                        )}</div></div>`
                      : ""
                  }
                </div>
                `
          )
          .addTo(movc);
      } else if (
        feature.geometry.type === "Polygon" ||
        feature.geometry.type === "MultiPolygon"
      ) {
        let country = countries[feature.properties.name] || {
          name: "gl js mapbox is awesome",
        };
        setTimeout(() => {
          if (country.name !== "gl js mapbox is awesome")
            if (lasticocords !== coordinates)
              return new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(
                  `
                    <div class="row" style="padding: 5px;">
                            <div class="col-12 col-sm-12" style="padding: 0px;">
                                    <img class="w-100 about-img" src="${
                                      country.img
                                    }">
                            </div>
                            <div class="col-12 text-center glass">
                                    <h5>
                                            ${country.name}
                                    </h5>
                            </div>
                            <div class="col-12 text-center glass"> 
                                  ${JSON.parse(feature.properties.tags).join(
                                    ", "
                                  )}
                            </div>
                            <div class="col-12 text-center glass"> 
                                Founding date: ${country.date}
                            </div>
                            <div class="col-md-12 col-sm-12 text-center glass">
                              ${
                                country.description
                                  ? `<div>${converter.makeHtml(
                                      country.description
                                    )}</div>`
                                  : ""
                              }
                            </div>
                            <div class="col-12 text-center mt-2">
                              ${
                                country.about
                                  ? `<a href="${country.about}" class="about">About</a>`
                                  : ""
                              }
                            </div>
                    </div>`
                )
                .addTo(movc);
        }, 1);
      }
    }
  });
};
