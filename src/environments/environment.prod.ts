const url = 'https://api.freedom.buzz';
const webUrl = 'https://freedom.buzz/';
const tubeUrl = 'https://tube.freedom.buzz/'


// const url = 'http://localhost:8080';
// const webUrl = 'http://localhost:4200/';

export const environment = {
  production: true,
  hmr: false,
  serverUrl: `${url}/api/v1/`,
  socketUrl: `${url}/`,
  webUrl: webUrl,
  tubeUrl: tubeUrl,
  domain: '.freedom.buzz',
  EncryptIV: 8625401029409790,
  EncryptKey: 8625401029409790
};
