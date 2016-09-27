declare class BatchManager {
    constructor(batchConfigPath: string);
    public run(bas? : { [name: string] :  any}): void;
}