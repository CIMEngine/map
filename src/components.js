import { Converter } from "showdown";
import l from "./locales";

let converter = new Converter();

export function countryPopup(country, properties) {
  return `<div class="row" style="padding: 5px;">
  ${img(country.img)}
  ${title(country.name)}
  <div class="col-12 text-center glass"> 
        ${JSON.parse(properties.tags || "[]").join(", ")}
  </div>
  <div class="col-12 text-center glass"> 
      ${l("founded")}: ${new Date(country.date).toLocaleDateString()}
  </div>
  <div class="col-md-12 col-sm-12 text-center glass">
    ${
      country.description
        ? `<div>${converter.makeHtml(country.description)}</div>`
        : ""
    }
  </div>
  <div class="col-12 text-center glass"> 
      ${l("area")}: ${properties.area} ${l("km")}²
  </div>
  <div class="col-12 text-center mt-2">
    ${
      country.about
        ? `<a href="${country.about}" class="about">${l("about")}</a>`
        : ""
    }
  </div>
</div>`;
}

function img(url) {
  return `<div class="col-12 col-sm-12" style="padding: 0px;"><img class="w-100 about-img" src="${url}"></div>`;
}

function title(name) {
  return `<div class="col-12 text-center glass"><h5>${name}</h5></div>`;
}

export function markerPopup(properties) {
  return `
  ${
    properties?.amount
      ? `<div class="row glass" style="color: "white";"><div class="col">${l(
          "population"
        )} - ${properties.amount} ${l("people")}.</div></div>`
      : ""
  }
  <div class="row" style="padding: 5px;">
    ${properties?.img ? img(properties.img) : ""}
    ${title(
      `${properties.name} ${
        properties.translated_name ? `- ${properties.translated_name}` : ""
      }`
    )}
    ${
      properties.description
        ? `<div class="col-md-12 col-sm-12 text-center glass"><div>${converter.makeHtml(
            properties.description
          )}</div></div>`
        : ""
    }
  </div>
  `;
}
