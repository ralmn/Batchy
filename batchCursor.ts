
/// <reference path="./batch.d.ts" />

import {BatchActivity, BatchSession} from './batch';


export abstract class BatchActivityCursor<T, U extends BatchSession> extends BatchActivity<T, U> {

    private offset = 0;
    public numberBS = 20;
    public packSize = 20;
    
    public selectData(callback, params?) {}
    
    public splitData(datas) { return null; }
    
    public abstract getCountData( callback : {(count : number): void}, params?: any ): void; 
        
    public abstract getData( starting: number, size: number ,callback : {(datas : T[]): void}, params?: any ): void;
    
    public execute(params?: any){
        this.log("Start cursor");
        let that = this;
        this.getCountData((count) => {
            this.log(`total of elements : ${count}`);
            if(count == 0){
                this.finishBA();
             
                return;
            }
            
            var startingTime = new Date().getTime();
            
            let nbBS = Math.min( Math.ceil(count / this.packSize), this.numberBS) ;
            this.currentBS = nbBS;
            for(var bsNumber = 0; bsNumber < nbBS; bsNumber++){
                var bs = this.createBatchSession();
                bs.dirChaine = this.dirChaine;
                let starting = that.offset;
                that.offset += that.packSize;
                that.getData(starting, that.packSize, (datas) => {
                    bs.execute(datas);
                }, params)
                
                bs.on('end', function(returningCode : number){
                    if(that.returningCode < returningCode ){
                        that.returningCode = returningCode;
                        this.log(`${this.bsID} => ${returningCode}`);
                        
                    }
                    let now = new Date().getTime();
                    
                    let diff = (now - startingTime);
                    
                    let leftSec = ( count - that.offset ) * (that.offset / (diff / 1000 ));
                    that.log(`Time left : ${Math.round(leftSec)} sec - ETA : ${new Date(now + leftSec * 1000)}`);
                    that.log(` ${diff/that.offset} elem/s `)
                    if(that.offset >= count){
                        that.currentBS--;
                        if(that.currentBS == 0)
                            that.finishBA();
                    }else{
                        try{
                            let newOffset = that.offset;
                            that.offset += that.packSize;
                            that.getData(newOffset, that.packSize, (datas) => {
                                bs.execute(datas);
                            }, params)
                        }catch(error){
                            this.log(error);
                        }
                    }
                })
                
                
            }
            
        }, params);
        
    }
    
    
}