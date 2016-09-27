/// <reference path="./batchCursorCluster.ts" />
import {BatchActivityCursorCluster} from './batchCursorCluster'
import * as cluster from 'cluster';
import * as mongoose from 'mongoose';
import {auth, program} from './util';
if(cluster.isWorker){
    cluster.worker.on('message', function(a){
        //console.log(a, ...a);
        (<any>e)(...a);
    });
}


let e =  function(ba, countData, countBS, packSize, params, baPath?){
        
        //Get BA class for worker creatuib
        let funcNameRegex = /function (.{1,})\(/;
        let results = (funcNameRegex).exec((<any> ba).constructor.toString());
        let name =  (results && results.length > 1) ? results[1] : "";``
        let chainDir = ba.dirChaine;
        
        //calculate elemPerWork
        let elemPerWork = Math.floor(countData / countBS);
        
        if(cluster.isMaster){
            cluster.setupMaster({
                exec: './cluster.js'
            });
            for(let i =0; i < countBS -1; i++){
                let w = cluster.fork();
                w.send([ba, countData, countBS, packSize, params, name]);
            }    
           
            
            let startIndex = elemPerWork * (countBS - 1);
            let finish = countData; 
            
            ba.startBS(startIndex, finish, params);
            ba.log(`Init master `);
        }else{
            auth((<any>program).env);
            //create BA worker
            let d = require(`./batchs/${baPath}`).default;
            ba = new d();
            ba.dirChaine = chainDir;
            ba.packSize = packSize;
            let clusId = parseInt(cluster.worker.id);
            ba.log(`Init #${clusId} worker`);
            
            let startIndex = elemPerWork * (clusId - 1);
            let finish = startIndex + elemPerWork;
            mongoose.connection.on('connected', () =>{
                ba.startBS(startIndex, finish, params);
            });
                        
        }
    
}

module.exports = e;