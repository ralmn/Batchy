/// <reference path="config.d.ts" />
/// <reference path="typings/tsd.d.ts" />

import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as redis from 'redis';
//import {config} from "./config";


import * as commander from 'commander';



export let program = commander.version("1.0")
    .option('-e, --env [env]','environnement')
    .parse(process.argv);


export let auth = function(env?:string){

  
  
  let config = getConfiguration(env);
  
  let databaseURL = config.database.url;
  let mongoOptions : mongoose.ConnectionOptions = {}; 
  
  if(config.database!= null && config.database.user != null && config.database.pass != null){
    mongoOptions.user = config.database.user;
    mongoOptions.pass = config.database.pass;
    if(config.database.dbAuth != null)
      mongoOptions.db = { authSource:  config.database.dbAuth}; 
  }
  // mongoose.set('debug', true);
  mongoose.connect(databaseURL, mongoOptions, (err) =>{
      // console.log(err, mongoose.connection.readyState);
  }); 
}

export let getConfiguration = function(env?: string){

  if(env == null){
    env = (<any>program).env;
  }

  let file = "./config";

  if(env != null && env != "prod"){
    file = `./config_${env}`;
  }

  return require(file).config; 

}

  
if(global['redisClient'] == null){
  global['redisClient'] = redis.createClient();
}


export let RedisClient  : redis.RedisClient = global['redisClient'];