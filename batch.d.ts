/// <reference path="log.d.ts" />


declare class BatchSession extends Logger{
    
    construtor();
    
    public execute<T>(elements: Array<T>): number;
    
    public doElement<T>(element: T): number;
}


declare class BatchActivity<T, U extends BatchSession > extends Logger{
    public numberBS : number;
    public selectData(callback : {([]): void}, params?: any) : void;
    public splitData(datas: Array<T>) : Array<Array<T>>
    public execute(params?: any);
    public createBatchSession(): U;
    public OnEnd(): void;
    
}