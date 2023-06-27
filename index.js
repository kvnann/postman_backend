require('dotenv').config();
const connectDB = require('./db/dbConn');
const server = require('./lib/server');

connectDB();
server.startHttpServer();