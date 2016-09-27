/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../batch.d.ts" />

import * as http from "http";
import * as url from "url";
import * as _ from "underscore";

import {BatchSession} from '../batch';


export default class BS_Exemple extends BatchSession {
    
    
    public doElement(element: any){
        //this.log(element);
        var that = this;
        setTimeout(function(){

            //Do action 

            that.finishOneData(-1); // -1 = OK; > 0 & < 10 = warning; >= 10 erreur (stop la BA)    
        }, 100)
        
    }
}