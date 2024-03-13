const url = 'https://dev-api.freedom.buzz';
const webUrl = 'https://dev.freedom.buzz/';
const tubeUrl = 'https://dev.tube.freedom.buzz/';

// const url = 'http://localhost:8080';
// const webUrl = 'http://localhost:4200/';

export const environment = {
  production: false,
  hmr: false,
  serverUrl: `${url}/api/v1/`,
  socketUrl: `${url}/`,
  webUrl: webUrl,
  tubeUrl: tubeUrl,
  domain: '.freedom.buzz',
  EncryptIV: 8625401029409790,
  EncryptKey: 8625401029409790,
  siteKey: '0x4AAAAAAAUtBoxdqH7NpIaT',
  secretKey: '0x4AAAAAAAUtBtTrRf7EnMn-dmdmAXPcngo',
};
