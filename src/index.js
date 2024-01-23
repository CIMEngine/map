import "./index.css";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import CompassControl from "@mapbox-controls/compass";
import InspectControl from "@mapbox-controls/inspect";
import StylesControl from "@mapbox-controls/styles";
import ZoomControl from "@mapbox-controls/zoom";
import LanguageControl from "@mapbox-controls/language";

import "@mapbox-controls/compass/src/index.css";
import "@mapbox-controls/inspect/src/index.css";
import "@mapbox-controls/styles/src/index.css";
import "@mapbox-controls/zoom/src/index.css";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import showdown from "showdown";

import l from "./locales";

function loginfo(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:white; background-color: #78d6fa; border-radius:10px;",
    ...str
  );
}
window.onload = async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const projection = params.projection || "globe";
  const mapId = params.id || "worldMap";

  let mIdData = (
    await (
      await fetch(
        `https://raw.githubusercontent.com/CIMEngine/MapList/main/index.json`
      )
    ).json()
  )[mapId];

  if (!mIdData) {
    alert(`Map "${mapId}" not found`);
  }

  let mData = {};

  mData.external = params.external || mIdData.external;

  if (mData.external) {
    mData = await (await fetch(mData.external)).json();
  }

  mData.geoURL = params.geoURL || mIdData.geoURL;
  mData.countryInfoUrl = params.countryInfoURL || mIdData.countryInfoURL;
  mData.debug = params.debug || false;
  mData.icon = params.icon || mIdData.icon;
  mData.name = params.name || mIdData.name;

  if (mData.icon) {
    document.getElementById("icon").setAttribute("href", mData.icon);
  }

  if (mData.name) {
    document.title = mData.name;
  }

  mapboxgl.accessToken =
    "pk.eyJ1IjoiYXJ0ZWdvc2VyIiwiYSI6ImNrcDViN3BhcDAwbW0ydnBnOXZ0ZzFreXUifQ.FIVtaBNr9dr_TIw672Zqdw";

  let map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/artegoser/clfm612fg002601nlcika2018?optimize=true",
    center: [53.19, 41.28],
    zoom: 3,
    projection: projection,
  });

  map.addControl(new ZoomControl(), "top-right");
  map.addControl(new CompassControl({ instant: true }), "top-right");
  map.addControl(new LanguageControl());
  map.addControl(
    new StylesControl({
      styles: [
        {
          label: "Streets",
          styleName: "Mapbox Streets",
          styleUrl:
            "mapbox://styles/artegoser/clfm612fg002601nlcika2018?optimize=true",
        },
        {
          label: "Satellite",
          styleName: "Satellite",
          styleUrl:
            "mapbox://styles/artegoser/cliskjlhw00ug01pgfs9lesog?optimize=true",
        },
      ],
    }),
    "top-left"
  );

  if (mData.debug) {
    map.addControl(new InspectControl({ console: true }), "bottom-right");
  }

  let converter = new showdown.Converter();

  map.on("style.load", async () => {
    map.loadImage(
      "https://cimengine.github.io/map/icons/city.png",
      (error, image) => {
        if (error) throw error;
        map.addImage("city", image);
      }
    );

    map.loadImage(
      "https://cimengine.github.io/map/icons/capital.png",
      (error, image) => {
        if (error) throw error;
        map.addImage("capital-city", image);
        map.addImage("capital", image);
      }
    );

    map.loadImage(
      "https://cimengine.github.io/map/icons/landmark.png",
      (error, image) => {
        if (error) throw error;
        map.addImage("landmark-0", image);
      }
    );

    let lasticocords;

    loginfo("Getting country data");
    let coarray = await fetch(mData.countryInfoUrl);
    coarray = await coarray.json();
    let countries = {};
    for (let i = 0; i < coarray.length; i++)
      countries[coarray[i].idc] = coarray[i];

    map.addSource("map-data", {
      type: "geojson",
      data: mData.geoURL,
    });

    map.addLayer({
      id: "map-data-fill-outline",
      type: "line",
      source: "map-data",
      paint: {
        "line-color": ["coalesce", ["get", "stroke"], "#0c7700"],
        "line-width": 2,
        "line-opacity": 0.8,
      },
    });

    map.addLayer({
      id: "map-data-fill",
      type: "fill",
      source: "map-data",
      paint: {
        "fill-color": ["get", "fill"],
        "fill-opacity": ["coalesce", ["get", "fill-opacity"], 0.3],
      },
    });

    map.addLayer({
      id: "map-data-symbol",
      type: "symbol",
      source: "map-data",
      layout: {
        "icon-image": ["get", "type"],
        "icon-size": 0.15,
      },
      minzoom: 3,
    });

    map.on("click", "map-data-fill", (e) => {
      const coordinates = e.lngLat;
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      onEachFeature(e.features[0], coordinates);
    });

    map.on("click", "map-data-symbol", (e) => {
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
                    ? `<div class="row glass" style="color: "white";"><div class="col">${l(
                        "population"
                      )} - ${feature.properties.amount} ${l(
                        "people"
                      )}.</div></div>`
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
                        feature.properties.translated_name
                          ? ` - ${feature.properties.translated_name}`
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
          .addTo(map);
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
                                  ${JSON.parse(
                                    feature.properties.tags || "[]"
                                  ).join(", ")}
                            </div>
                            <div class="col-12 text-center glass"> 
                                ${l("founded")}: ${new Date(
                    country.date
                  ).toLocaleDateString()}
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
                            <div class="col-12 text-center glass"> 
                                ${l("area")}: ${feature.properties.area} ${l(
                    "km"
                  )}²
                            </div>
                            <div class="col-12 text-center mt-2">
                              ${
                                country.about
                                  ? `<a href="${
                                      country.about
                                    }" class="about">${l("about")}</a>`
                                  : ""
                              }
                            </div>
                    </div>`
                )
                .addTo(map);
        }, 1);
      }
    }
  });
};
