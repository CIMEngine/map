let locales = {
  en: {
    population: "Population",
    people: "people",
    area: "Area",
    km: "km",
    about: "About",
    founded: "Founded",
    streets: "Streets",
    satellite: "Satellite",
  },
  ru: {
    population: "Население",
    people: "человек",
    area: "Площадь",
    km: "км",
    about: "Больше",
    founded: "Основано",
    streets: "Улицы",
    satellite: "Спутник",
  },
};

let lang = (navigator.language || navigator.userLanguage).split("-")[0];

export default function l(n) {
  return locales[lang][n] || locales.en[n] || n;
}
