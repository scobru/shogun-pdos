const express = require('express');
const Gun = require('gun');
const cors = require('cors');

const app = express();
const port = 8765;

app.use(cors());

// Serve static files from current directory
app.use(express.static(__dirname));

const server = app.listen(port, () => {
  console.log(`\n> Shogun NoBackend Sync Server`);
  console.log(`> Local: http://localhost:${port}`);
  console.log(`> Gun:   http://localhost:${port}/gun`);
});

Gun({
  web: server,
  file: 'data', // Local storage folder
  cors: {
    origin: '*',
    methods: 'GET,PUT,POST,DELETE,OPTIONS'
  }
});
