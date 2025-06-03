import { AnalysisReport } from '../entities/AnalysisReport';

/**
 * Interface para operações de repositório
 * Esta interface abstrai o acesso ao repositório de código fonte
 */
export interface IRepository {
    /**
     * Inicializa a conexão com o repositório
     * @returns Promise que resolve quando a conexão for estabelecida
     */
    initialize(): Promise<void>;
    
    /**
     * Verifica se o contexto atual é um Pull Request
     * @returns Promise que resolve para true se estamos em um contexto de PR, false caso contrário
     */
    isPullRequestContext(): Promise<boolean>;
      /**
     * Baixa os arquivos alterados em um Pull Request
     * @param targetDirectory Diretório para salvar os arquivos
     * @param excludePatterns Padrões glob para exclusão de arquivos (opcional)
     * @returns Promise com lista de caminhos de arquivos baixados
     */
    downloadPullRequestFiles(targetDirectory: string, excludePatterns?: string[]): Promise<string[]>;
    
    /**
     * Adiciona um comentário ao Pull Request
     * @param commentContent Conteúdo do comentário
     * @param filePath Caminho do arquivo para comentário em linha (opcional)
     * @param lineNumber Número da linha para comentário em linha (opcional)
     * @returns Promise que resolve quando o comentário for adicionado
     */
    addPullRequestComment(commentContent: string, filePath?: string, lineNumber?: number): Promise<void>;
    
    /**
     * Define o status do Pull Request
     * @param status Status a ser definido ('approved', 'rejected', ou 'waiting')
     * @param description Descrição opcional do status
     * @returns Promise que resolve quando o status for atualizado
     */
    setPullRequestStatus(status: 'approved' | 'rejected' | 'waiting', description?: string): Promise<void>;
    
    /**
     * Adiciona o resultado de uma análise como comentários ao Pull Request
     * @param report Relatório de análise
     * @param repositoryPath Caminho base do repositório local
     * @returns Promise que resolve quando todos os comentários forem adicionados
     */
    addAnalysisResultToPullRequest(report: AnalysisReport, repositoryPath: string): Promise<void>;
}
