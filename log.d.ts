/// <reference path="typings/index.d.ts" />


declare class Logger{
    log(...message): void;
    error(...message): void;
    warm(...message): void;
    getClassName(): String;
    getLogFileName(): String;
    getLogTitle(): String;
    
}