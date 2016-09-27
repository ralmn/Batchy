/// <reference path="../batch.d.ts" />
import * as mongoose from 'mongoose';
import {BatchActivity} from '../batch';
import BS_Exemple from './BS_Exemple';

export default class BA_Exemple extends BatchActivity<String, BS_Exemple> {
    
    
    public selectData(callback){
        let datas = []
        for(let i =0; i < 5000; i++){
            datas.push({id: i, name: 'elem'+i});
        }
        callback(datas);
    }
    
    public splitData(datas: string[]){
        let packets = [];

        for(let i = 0; i < Math.floor(datas.length / this.packSize); i++){
            let packet = [];
            for(let j = i * this.packSize; j < ( (i +1) * this.packSize ); j++){
                packet.push(datas[j]);
            }
            packets.push(packet);
        }
        let packetFinal = []
        for(let j = Math.floor(datas.length / this.packSize) * this.packSize; j < datas.length; j++){
                packetFinal.push(datas[j]);
        }
        if(packetFinal.length > 0)
            packets.push(packetFinal)

        this.log(`${packets.length} packets`);

        return packets;
    }
    
    createBatchSession(){
        return new BS_Exemple();
    }
    
    
}