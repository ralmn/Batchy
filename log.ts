import * as fs from 'fs';
import * as path from 'path';
import * as events from 'events';

export class Logger extends events.EventEmitter{
    
    fileOutput: any;
    public dirChaine = '';
    
    public getClassName() {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec((<any> this).constructor.toString());
        return (results && results.length > 1) ? results[1] : "";
    }
    
    
    
    public getLogFileName(){    
        return `${this.getClassName()}`;
    }
    
    public getLogTitle(){
        return `${this.getClassName()} : ${new Date().toString()} : `
    }
    
    private getFileLogPath(){
        let date = new Date();
        let dateStr = `${date.getFullYear()}_${this.zeroPad((date.getMonth()+1).toString(), 2)}_${this.zeroPad(date.getDate().toString(), 2)}`
        let dateYearMonth = `${date.getFullYear()}_${this.zeroPad((date.getMonth()+1).toString(), 2)}`;
        let directory = path.join(__dirname, 'logs', dateYearMonth, dateStr, this.dirChaine);
        if(!fs.existsSync(directory)){
            let mkdirp = require('mkdirp');

            mkdirp.sync(directory);
        }
            
        return path.join(directory, `${this.getLogFileName()}.log`) 
        
    }    
    public log(...messages){
        
        if(this.fileOutput == null){
            let fileLogPath = this.getFileLogPath();
            this.fileOutput = fs.createWriteStream(fileLogPath);
        }    
        let fileConsole = new (require('console').Console)(this.fileOutput);
        
        fileConsole.log(this.getLogTitle(), ...messages);
        console.log(this.getLogTitle(), ...messages);
    }
    
    public error(... messages){
        if(this.fileOutput == null){
            let fileLogPath = this.getFileLogPath();
            this.fileOutput = fs.createWriteStream(fileLogPath);
        }  
        let fileConsole = new (require('console').Console)(this.fileOutput);
        
        messages.unshift("[ERROR]");
        
        fileConsole.error(this.getLogTitle(), ...messages);
        console.error(this.getLogTitle(), ...messages);
        
        
    }
    
    public warm(... messages){
         if(this.fileOutput == null){
            let fileLogPath = this.getFileLogPath();
            this.fileOutput = fs.createWriteStream(fileLogPath);
        }  
        let fileConsole = new (require('console').Console)(this.fileOutput);
        
        messages.unshift("[WARNING]");
        
        fileConsole.warn(this.getLogTitle(), ...messages);
        console.warn(this.getLogTitle(), ...messages);
        
        
    }
    
    public zeroPad(str: string, places: number) {
        let zero = Math.max(places - str.length, 0);
        for(let i =0; i< zero; i++){
            str = "0" + str;
        } 
        
        return str;
    }
    
}