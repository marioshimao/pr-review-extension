/**
 * Representa um problema encontrado durante a análise de código
 * Esta entidade armazena informações sobre problemas ou sugestões no código analisado
 */
export class CodeIssue {
    /**
     * Construtor para a classe CodeIssue
     * @param file - Caminho do arquivo onde o problema foi encontrado
     * @param line - Número da linha onde o problema foi encontrado
     * @param message - Mensagem descritiva do problema
     * @param severity - Nível de severidade do problema (high, medium, low)
     * @param responseFormat - Formato de resposta esperado (json, markdown) 
     */
    constructor(
        public file: string,
        public line: number,
        public message: string,
        public severity: 'high' | 'medium' | 'low' = 'medium',
        public responseFormat: 'json' | 'markdown' = 'json'
    ) {}

    /**
     * Cria uma representação em string do problema no formato requerido para relatórios
     * @returns String formatada com informações do problema
     */
    public toString(): string {
        return `**[${this.file}:${this.line}]** ${this.message} (${this.severity})`;
    }
}
