
/// <reference path="./batch.d.ts" />
import * as cluster from 'cluster';
import {BatchActivity, BatchSession} from './batch';


export abstract class BatchActivityCursorCluster<T, U extends BatchSession> extends BatchActivity<T, U> {

    private offset = 0;
    public numberBS = 20;
    public packSize = 20;
    public currentWorker = -1;
    public startingTime = 0;
    
    public selectData(callback, params?) {}
    
    public splitData(datas) { return null; }
    
    public abstract getCountData( callback : {(count : number): void}, params?: any ): void; 
        
    public abstract getData( starting: number, size: number ,callback : {(datas : T[]): void}, params?: any ): void;
    
    public execute(params?: any){
        this.log("Start cursor cluster");
        let that = this;
        if(this.packSize <= 0) this.packSize = 1
        this.getCountData((count) => {
            this.log(`total of elements : ${count}`);
            if(count == null || count <= 0){
                this.finishBA();
             
                return;
            }
            
            var startingTime = new Date().getTime();
            
            let nbBS = Math.min( Math.ceil(count / this.packSize), this.numberBS) ;
            this.currentWorker = nbBS;
            that.startingTime = new Date().getTime();
            require('./cluster')(this, count, nbBS, this.packSize, params);           
            
            
            
        }, params);
        
    }
    
    public startBS(startIndex: number, limit: number, params?: any){
        let that = this;
        if(cluster.isMaster){
            cluster.on('message', (messageData) => {
                console.log('message from worker', messageData);
                
                if((<any>messageData).action = 'finishBS'){
                    that.finishBS((<any>messageData).returningCode);
                }
            });
        }
        
        this.currentBS++;
        
        let bs = this.createBatchSession();
        bs.dirChaine = this.dirChaine;
        that.startingTime = new Date().getTime();
            
        var offset = startIndex; 
        var returningCode = 0;
        let next = () => {
            
            if(offset >= limit){ //Fin batch
                this.finishBS(returningCode);
                return;
            }
            if(that.packSize <= 0) that.packSize = 1            
            let startGet = offset;
            offset += that.packSize;
            that.getData(startGet, that.packSize, ( data ) => {
                if(data == null){
                    that.getData(startGet, that.packSize, (dataRetry) => {
                        if(dataRetry == null){
                            next()
                        }else{
                            bs.execute(dataRetry);
                        }
                    }, params)
                }else{
                    bs.execute(data);
                    
                }
            }, params);
        }
        
        bs.on('end', (rCode) => {
            returningCode = rCode;
            next();
        });
        
        next();
        
    }
    
    public finishBS(returningCode : number){
        this.log(`Finish ${cluster.isMaster ? 'master' : cluster.worker.id}`)
                
        if(cluster.isWorker){
            process.send({action: 'finishBS', returningCode});
            return;
        }
        
        this.currentWorker -= 1;
        if(returningCode > this.returningCode) this.returningCode = returningCode;
        
        if(this.currentWorker <= 0){
            cluster.removeAllListeners('message');
            this.log('All BS cluster are finished ?');
            this.emit('end', this.returningCode);
        }
        
    }
    
    
}