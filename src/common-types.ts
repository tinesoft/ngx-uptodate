

export interface Logger{
    debug : (message:string) => void
    info : (message:string) => void
    warning : (message:string) => void
    error : (message:string) => void
}

export class ConsoleLogger implements Logger {
    public debug(message: string): void{
        console.log(message);
    }

    public info(message: string): void{
        console.info(message);
    }

    public warning(message: string): void{
        console.warn(message);
    }

    public error(message: string): void{
        console.error(message);
    }
}
