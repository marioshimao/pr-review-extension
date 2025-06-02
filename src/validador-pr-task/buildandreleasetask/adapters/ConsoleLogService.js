"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogService = void 0;
/**
 * Implementação de ILogService usando o console para logging
 */
class ConsoleLogService {
    /**
     * Registra uma mensagem informativa
     * @param message Mensagem a ser registrada
     */
    info(message) {
        console.info(message);
    }
    /**
     * Registra uma mensagem de log
     * @param message Mensagem a ser registrada
     */
    log(message) {
        console.log(message);
    }
    /**
     * Registra uma mensagem de aviso
     * @param message Mensagem a ser registrada
     */
    warn(message) {
        console.warn(message);
    }
    /**
     * Registra uma mensagem de erro
     * @param message Mensagem a ser registrada
     */
    error(message) {
        console.error(message);
    }
}
exports.ConsoleLogService = ConsoleLogService;
