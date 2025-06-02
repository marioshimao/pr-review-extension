import { ILogService } from '../interfaces/ILogService';

/**
 * Implementação de ILogService usando o console para logging
 */
export class ConsoleLogService implements ILogService {
    /**
     * Registra uma mensagem informativa
     * @param message Mensagem a ser registrada
     */
    public info(message: string): void {
        console.info(message);
    }
    
    /**
     * Registra uma mensagem de log
     * @param message Mensagem a ser registrada
     */
    public log(message: string): void {
        console.log(message);
    }
    
    /**
     * Registra uma mensagem de aviso
     * @param message Mensagem a ser registrada
     */
    public warn(message: string): void {
        console.warn(message);
    }
    
    /**
     * Registra uma mensagem de erro
     * @param message Mensagem a ser registrada
     */
    public error(message: string): void {
        console.error(message);
    }
}
