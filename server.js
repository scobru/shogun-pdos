const express = require('express');
const Gun = require('gun');
const cors = require('cors');

const ws = require('gun/lib/ws');

const app = express();
const port = process.env.PORT || 8765;

app.use(cors());

// Security middleware to block sensitive files
app.use((req, res, next) => {
  const path = req.path.toLowerCase();

  const blockedFiles = [
    '/server.js',
    '/package.json',
    '/package-lock.json',
    '/yarn.lock',
    '/dockerfile',
    '/docker-compose.yml',
    '/vercel.json',
    '/readme.md',
    '/agents.md'
  ];

  const blockedDirs = [
    '/data',
    '/node_modules',
    '/.git'
  ];

  // Block specific sensitive files
  if (blockedFiles.includes(path)) {
    return res.status(403).send('Forbidden');
  }

  // Block sensitive directories
  if (blockedDirs.some(dir => path === dir || path.startsWith(dir + '/'))) {
    return res.status(403).send('Forbidden');
  }

  // Block dotfiles (files starting with .)
  if (path.includes('/.')) {
     return res.status(403).send('Forbidden');
  }

  next();
});

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
