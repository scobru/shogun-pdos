const express = require('express');
const Gun = require('gun');
const cors = require('cors');

const ws = require('gun/lib/ws');

const app = express();
const port = process.env.PORT || 8765;

app.use(cors());

// Serve static files from current directory
app.use(express.static(__dirname));

const server = app.listen(port, async () => {
  const os = require('os');
  const networks = os.networkInterfaces();
  let lanIp = 'localhost';

  // Find LAN IP
  for (const name of Object.keys(networks)) {
    for (const net of networks[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        lanIp = net.address;
        break;
      }
    }
  }

  // Find Public IP
  let publicIp = '...';
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    publicIp = data.ip;
  } catch (e) {
    publicIp = 'Unavailable';
  }

  console.log(`\n> PDOS 01 Sync Server`);
  console.log(`> Local:  http://localhost:${port}`);
  console.log(`> LAN:    http://${lanIp}:${port}`);
  console.log(`> Public: http://${publicIp}:${port}`);
  console.log(`> Gun:    http://localhost:${port}/gun`);
});

Gun({
  web: server,
  radisk:true,
  file: 'data', // Local storage folder
  cors: {
    origin: '*',
    methods: 'GET,PUT,POST,DELETE,OPTIONS'
  }
});
