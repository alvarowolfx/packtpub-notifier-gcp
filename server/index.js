'use strict';

if (process.env.NODE_ENV === 'production') {
  require('@google/cloud-trace').start();
}

const Hapi = require('hapi');
const Joi = require('joi');
const Boom = require('boom');
const Inert = require('inert');
const Vision = require('vision');
const Pack = require('./package');
const glob = require('glob');
const path = require('path');
const stringify = require('querystring').stringify;
const fs = require('fs');
const server = new Hapi.Server();
const HapiSwagger = require('hapi-swagger');

// Create a server with a host and port
server.connection({
  host: '0.0.0.0',
  port: process.env.PORT || 8080
});

const options = {
  info: {
    title: 'PacktPub Notifier API',
    version: Pack.version
  },
  host: process.env.HOST || 'localhost:8080',
  pathPrefixSize: 2,
  basePath: '/api/'
};

server.register([
  Inert,
  Vision,
  {
    register: HapiSwagger,
    options: options
  }], (err) => {

    // Registra todas as rotas baseadas nas pastas e arquivos
    glob.sync('api/**/routes/*.js', {
      root: __dirname
    }).forEach(file => {
      const route = require(path.join(__dirname, file));
      server.route(route);
    });

  });

server.start((err) => {
  if (err) {
    throw err;
  }
});
