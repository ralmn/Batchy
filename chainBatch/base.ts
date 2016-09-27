/// <reference path="../batchManager.d.ts" />
/// <reference path="../config.d.ts" />
/// <reference path="../typings/tsd.d.ts" />
import * as mongoose from 'mongoose';

import {config} from "../config";
import * as path from 'path';
import {BatchManager} from '../batchManager';
import * as cluster from 'cluster';

import {auth, program} from '../util';

export default function (chainName: string ){

//require('../auth')();

let env =(<any>program).env;

if(env != null){
    console.log("Environnement : ", env);
}

auth(env);

//let confPath = path.join(__dirname,'..' ,'batchs', 'conf.json');
let confPath = path.join(__dirname,`${chainName}.json`);


if(cluster.isMaster){
    let batchManager = new BatchManager(confPath);
    batchManager.dirChaine = chainName;
    batchManager.run();    
}

//mongoose.disconnect();

}