"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeIssue = void 0;
/**
 * Representa um problema encontrado durante a análise de código
 * Esta entidade armazena informações sobre problemas ou sugestões no código analisado
 */
class CodeIssue {
    file;
    line;
    message;
    severity;
    responseFormat;
    /**
     * Construtor para a classe CodeIssue
     * @param file - Caminho do arquivo onde o problema foi encontrado
     * @param line - Número da linha onde o problema foi encontrado
     * @param message - Mensagem descritiva do problema
     * @param severity - Nível de severidade do problema (high, medium, low)
     * @param responseFormat - Formato de resposta esperado (json, markdown)
     */
    constructor(file, line, message, severity = 'medium', responseFormat = 'json') {
        this.file = file;
        this.line = line;
        this.message = message;
        this.severity = severity;
        this.responseFormat = responseFormat;
    }
    /**
     * Cria uma representação em string do problema no formato requerido para relatórios
     * @returns String formatada com informações do problema
     */
    toString() {
        return `**[${this.file}:${this.line}]** ${this.message} (${this.severity})`;
    }
}
exports.CodeIssue = CodeIssue;
