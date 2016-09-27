///<reference path="typings/tsd.d.ts"/>

import * as events from "events";
import * as cluster from "cluster";
import * as fs from 'fs';
import * as path from 'path';
import {Logger} from './log';

export abstract class BatchSession extends Logger{
    
    public static BSCount = {};
    private dateExecution = `${new Date().getDate()}${new Date().getMonth()}${new Date().getFullYear()}_${new Date().getUTCSeconds()}`;
    private currentData : number;
    public bsID = -1;
    private returningCode = -1;
    private datas = [];
    
    
	public execute<T>(elements : Array<T>){
        this.log(`starting ${elements.length} elements to process`);
        this.currentData = elements.length;
        this.datas = elements;
        let data =  this.datas.shift();
        if(data == null)
          this.finishOneData(-1);  
        else
		  this.doElement(data);
        
        
        return -1;
	}

	public abstract doElement<T>(element: T): void; 
    
    protected finishOneData(returningCode: number){
        
        if(this.returningCode < returningCode){
            this.returningCode = returningCode;
            this.log("end", returningCode);
            this.emit('end', returningCode);
            return;
        }
        if(this.datas.length == 0){
            this.log("end");
            this.emit('end', returningCode);
        }else{
            this.doElement(this.datas.shift());
        }
    }
    
    private getId() : any{
        if(cluster.isWorker){
            return `W#${cluster.worker.id}`
        }
        if(BatchSession.BSCount[this.getClassName()] == null) BatchSession.BSCount[this.getClassName()] = 0;
        if(this.bsID <= 0){
            BatchSession.BSCount[this.getClassName()] = BatchSession.BSCount[this.getClassName()] + 1
            this.bsID = BatchSession.BSCount[this.getClassName()];
        } 
       return this.bsID;
    }
    
    
    
    getLogFileName(){
        return `${this.getClassName()}_${this.getId()}`;
    }
    
    getLogTitle(){
        return `${this.getClassName()} ${this.getId()} : ${new Date().toString()} : `
    }
    
    
    
}

export interface IBatchActivity extends events.EventEmitter{
    numberBS: number;
    packSize: number;
    execute(params?: any);
    log(...message : any[]): void
    setDirChaine(dir:string): void
}

export abstract class BatchActivity<T, U extends BatchSession> extends Logger implements IBatchActivity {

    protected currentBS : number;
    protected returningCode = -1;
    
    public numberBS = -1;
    public packSize = -1;
	
    public abstract selectData(callback : {([]): void}, params? : any) : void;
    
    public abstract splitData(datas: Array<T>) : Array<Array<T>>
    
    public execute(params?: any){
        this.log("Start")
        this.selectData((datas) => {
            this.log(`${datas.length} for split`);
            let datasForBS = this.splitData(datas);
            
            let BSs: U[] = [];
            this.currentBS = datasForBS.length;
            
            let that = this;
            if(datasForBS.length == 0){
                this.finishBA();
                return;
            }
            
            if(this.numberBS == -1) this.numberBS = datasForBS.length
            
            for(var bsNumber = 0; bsNumber < Math.min(this.numberBS, datasForBS.length); bsNumber++){
                let bsDatas = datasForBS.shift();
                if(bsDatas == null || bsDatas.length == 0) continue;
                let bs = this.createBatchSession();
                bs.dirChaine = this.dirChaine;
                bs.on('end', function(returningCode:  number){
                    
                    if(that.returningCode < returningCode){
                        that.returningCode = returningCode;
                        this.log(`${this.bsID} => ${returningCode}`);
                     }
                    if(datasForBS.length == 0){
                       that.currentBS -= 1;
                       if(that.currentBS <= 0){
                            that.finishBA();
                        }    
                    }else{
                        try{
                            let newbsDatas = datasForBS.shift();
                            if(newbsDatas == null || newbsDatas.length == 0){
                                that.currentBS -= 1;
                                if(that.currentBS <= 0){
                                    that.finishBA();
                                }    
                            }else{
                                this.execute(newbsDatas);                                
                            }
                        }catch(e){
                            this.log(e);
                        }
                    }
                });
                try{
                    bs.execute(bsDatas);
                }catch(e){
                    bs.log(e);
                }
                BSs.push(bs);
                
            }
        }, params);
        
    }
    
    public OnEnd(){}

    protected finishBA(){
        this.OnEnd();
        this.log("End -> returningCode : ", this.returningCode);
        this.emit('end', this.returningCode);
    }
    
    public abstract createBatchSession() : U;
    
    public setDirChaine(dir:string){
        this.dirChaine = dir;
    }
    
    //
  
    
} 


