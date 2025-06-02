/**
 * Interface para serviços de log
 * Esta interface abstrai o sistema de log, permitindo diferentes implementações
 */
export interface ILogService {
    /**
     * Registra uma mensagem informativa
     * @param message Mensagem a ser registrada
     */
    info(message: string): void;
    
    /**
     * Registra uma mensagem de log
     * @param message Mensagem a ser registrada
     */
    log(message: string): void;
    
    /**
     * Registra uma mensagem de aviso
     * @param message Mensagem a ser registrada
     */
    warn(message: string): void;
    
    /**
     * Registra uma mensagem de erro
     * @param message Mensagem a ser registrada
     */
    error(message: string): void;
}
