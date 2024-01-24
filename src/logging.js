export function info(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:black; background-color: #78d6fa; border-radius:10px;",
    ...str
  );
}

export function log(...str) {
  console.log(...str);
}

export function error(...str) {
  let info = str.shift();
  console.log(
    `%c ${info} `,
    "color:black; background-color: #ff0000; border-radius:10px;",
    ...str
  );
}
