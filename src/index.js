import "./styles/index.css";

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

import { countryPopup, markerPopup } from "./components";

import l from "./locales";
import { info, error, log } from "./logging";

window.onload = async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  const projection = params.projection || "globe";
  const mapId = params.id || "worldMap";

  info("Loading", mapId);
  let mData = (
    await (
      await fetch(
        `https://raw.githubusercontent.com/CIMEngine/MapList/main/index.json`
      )
    ).json()
  )[mapId];

  if (!mData) {
    error(`Map "${mapId}" not found`);
  }

  if (params.external || mData.external) {
    info("Getting data from external", params.external || mData.external);
    mData = await (await fetch(params.external || mData.external)).json();
  }

  mData.geoURL = params.geoURL || mData.geoURL;
  mData.countryInfoUrl = params.countryInfoURL || mData.countryInfoURL;
  mData.debug = params.debug || false;
  mData.icon = params.icon || mData.icon;
  mData.name = params.name || mData.name;

  if (mData.icon) {
    info("Setting icon", mData.icon);
    document.getElementById("icon").setAttribute("href", mData.icon);
  }

  if (mData.name) {
    info("Setting title", mData.name);
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

  info("Adding controls");
  map.addControl(new ZoomControl(), "top-right");
  map.addControl(new CompassControl({ instant: true }), "top-right");
  map.addControl(new LanguageControl());
  map.addControl(
    new StylesControl({
      styles: [
        {
          label: l("streets"),
          styleName: "Mapbox Streets",
          styleUrl:
            "mapbox://styles/artegoser/clfm612fg002601nlcika2018?optimize=true",
        },
        {
          label: l("satellite"),
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

  map.on("style.load", async () => {
    info("Loading icons");
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

    info("Getting country data from", mData.countryInfoUrl);
    let coarray = await fetch(mData.countryInfoUrl);
    coarray = await coarray.json();
    let countries = {};

    info("Adding country data", `${coarray.length} countries`);
    for (let i = 0; i < coarray.length; i++)
      countries[coarray[i].idc] = coarray[i];

    info("Adding map data", mData.geoURL);
    map.addSource("map-data", {
      type: "geojson",
      data: mData.geoURL,
    });

    info("---Adding layers---");
    log("map-data-fill-outline");
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

    log("map-data-fill");
    map.addLayer({
      id: "map-data-fill",
      type: "fill",
      source: "map-data",
      paint: {
        "fill-color": ["get", "fill"],
        "fill-opacity": ["coalesce", ["get", "fill-opacity"], 0.3],
      },
    });

    log("map-data-symbol");
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
    info("---Layers added---");

    info("Adding event listeners for clicks");
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
          .setHTML(markerPopup(feature.properties))
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
                .setHTML(countryPopup(country, feature.properties))
                .addTo(map);
        }, 1);
      }
    }
  });
};
