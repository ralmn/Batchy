/// <reference path="typings/index.d.ts" />

import * as fs from 'fs';
import * as path from 'path';
import {IBatchActivity} from './batch';
import {Logger} from './log';

export class BatchManager extends Logger{
    
    private batchConfigPath: string
    private batchs = [];
    
    private logPath: string;
    
    public constructor(batchConfigPath: string){
        super();
        this.batchConfigPath = batchConfigPath;
        this.initLogDir();
    }
    
    public initLogDir(){
        if(!fs.existsSync('./logs/')){
            fs.mkdirSync('./logs');
        }
        
    }
    
    
    public run(bas? : { [name: string] :  any}){
        try{
            if(!fs.existsSync(this.batchConfigPath))
                throw new Error(`Batch configuration file ${this.batchConfigPath} doesn't exists`);
            
            let fileContentRaw = fs.readFileSync(this.batchConfigPath);
            try{
                this.batchs = JSON.parse(fileContentRaw.toString());
            }catch(e){
                throw new Error(`Error when parsing batch configuration file : ${e.message}`);
            }   
            
            if(bas != null){
                let newBatchs = [];
                
                for(var batchName of Object.keys(bas)){
                    let batch = {params: bas[batchName]};                    
                    let findBatch = this.batchs.filter((val, i, a) => { return val.name == batchName });
                    if(findBatch.length == 0) continue;
                    
                    let firstBatch = findBatch[0];
                    
                    for(let key of Object.keys(firstBatch)){
                        if(key == 'params') continue;
                        batch[key] = firstBatch[key]
                    }
                    if(firstBatch.params != null){
                        for(let key of Object.keys(firstBatch.params)){
                            if(batch.params[key] != null) continue;
                            batch.params[key] = firstBatch.params[key]
                        }
                    }
                    newBatchs.push(batch);
                    
                }
                
                this.batchs = newBatchs;
            }
            
            
            this.log('Execute : ', this.batchs);
            
            this.nextBatch();       
        }catch(e){
            this.log(e);
        }
         
    }
    
    private nextBatch(){
        if(this.batchs.length == 0){
            process.exit();
        }
        let batchData = this.batchs[0];
        //this.batchs = this.batchs.splice(0,1);
        this.batchs.shift();
        
        this.executeBA(batchData);
    }
    
    private executeBA(batchData : any){
        let that = this;
        let baClass = require('./batchs/' + batchData.name).default;
          
        let ba : IBatchActivity =  new baClass();
        ba.setDirChaine(this.dirChaine);
        let params = batchData.params;
        if(batchData.numberBS != null){
            ba.numberBS = batchData.numberBS;
        }
        if(batchData.packSize != null){
            ba.packSize = batchData.packSize;
        }
        ba.on('end', function(returningCode : number){
            that.log(batchData.name, ' return code ', returningCode);
            if(returningCode < 10){
                that.nextBatch();
            } else {
                process.exit(returningCode);     
            }
        })
        try{
            ba.execute(params);
        }catch(e){
            ba.log(e);
        }
       
    }
    
    public getLogFileName(){
        let date = `${new Date().getDate()}${new Date().getMonth()}${new Date().getFullYear()}`
        this.logPath = `0_${this.getClassName()}_${date}`;
        return this.logPath;
    }
    
    
    
}