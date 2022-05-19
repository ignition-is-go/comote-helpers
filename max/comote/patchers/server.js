// const MAX = require('max-api');
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const { WebSocketServer } = require('ws');
const CoMote = require('@ircam/comote-helpers/server.js');

const comoteConfig = {
  id: 0,
  interval: 20, // period in ms
  ws: null,
  osc: {
    port: 8902,
    hostname: '',
    autostart: false,
  },
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = `./public${parsedUrl.pathname}`;
  const ext = path.parse(pathname).ext || '.html';
  // maps file extension to MIME typere
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    // '.png': 'image/png',
    // '.jpg': 'image/jpeg',
    // '.wav': 'audio/wav',
    // '.mp3': 'audio/mpeg',
    // '.svg': 'image/svg+xml',
    // '.pdf': 'application/pdf',
    // '.doc': 'application/msword'
  };

  fs.exists(pathname, (exist) => {
    if (!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    // if is a directory search for index file matching the extension
    if (fs.statSync(pathname).isDirectory()) {
      pathname += 'index.html';
    }

    // read file from file system
    fs.readFile(pathname, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', map[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });


});;

const wss = new WebSocketServer({ server });

wss.on('connection', async function connection(ws) {
  const wifiInfos = await CoMote.getWifiInfos();
  comoteConfig.osc.hostname = wifiInfos.ip;

  ws.send(JSON.stringify({ type: 'wifiInfos', payload: wifiInfos }));
  ws.send(JSON.stringify({ type: 'comoteConfig', payload: comoteConfig }));
});

server.listen(8080, () => {
  console.log('server listening on http://127.0.0.1:8080');
});

console.log('coucou');
