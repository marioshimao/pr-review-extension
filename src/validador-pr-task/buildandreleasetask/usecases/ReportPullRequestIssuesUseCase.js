"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportPullRequestIssuesUseCase = void 0;
/**
 * Caso de uso para reportar problemas em Pull Requests
 * Esta classe implementa a lógica de negócio para adicionar comentários em PRs
 */
class ReportPullRequestIssuesUseCase {
    repository;
    fileService;
    logger;
    /**
     * Construtor para a classe ReportPullRequestIssuesUseCase
     * @param repository Repositório
     * @param fileService Serviço de arquivos
     * @param logger Serviço de log
     */
    constructor(repository, fileService, logger) {
        this.repository = repository;
        this.fileService = fileService;
        this.logger = logger;
    }
    /**
     * Reporta problemas encontrados em um Pull Request
     * @param report Relatório de análise
     * @param repositoryPath Caminho base do repositório
     * @param outputFilePath Caminho para salvar o relatório (opcional)
     * @param failOnIssues Se deve falhar a execução quando encontrar problemas
     * @returns Promise<boolean> true se executou com sucesso, false caso contrário
     */
    async execute(report, repositoryPath, outputFilePath, failOnIssues = false) {
        try {
            // Gerar o relatório em formato Markdown
            const reportContent = report.generateMarkdownReport();
            // Salvar o relatório em arquivo, se um caminho for fornecido
            if (outputFilePath) {
                try {
                    await this.fileService.writeFile(outputFilePath, reportContent);
                    this.logger.info(`Relatório salvo em: ${outputFilePath}`);
                }
                catch (writeError) {
                    this.logger.error(`Erro ao salvar relatório: ${writeError.message}`);
                }
            }
            // Exibir informações no console
            this.logger.info(`\n${reportContent}`);
            // Verificar se estamos em um contexto de PR
            const isPrContext = await this.repository.isPullRequestContext();
            if (isPrContext) {
                try {
                    this.logger.info('Adicionando comentários ao PR...');
                    // Adicionar comentários ao PR usando a classe Repository
                    await this.repository.addAnalysisResultToPullRequest(report, repositoryPath);
                    this.logger.info('Comentários adicionados ao PR com sucesso.');
                }
                catch (commentError) {
                    this.logger.warn(`Erro ao adicionar comentários ao PR: ${commentError.message}`);
                    // Não falhar o build por causa disso
                }
            }
            else {
                this.logger.info('Não estamos em um contexto de Pull Request. Comentários não serão adicionados.');
            }
            // Decidir se deve falhar baseado na quantidade de problemas
            const shouldFail = failOnIssues && report.hasIssues();
            if (shouldFail) {
                this.logger.error(`Encontrados ${report.getIssueCount()} problemas no código.`);
                return false;
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao reportar problemas: ${error.message}`);
            return false;
        }
    }
}
exports.ReportPullRequestIssuesUseCase = ReportPullRequestIssuesUseCase;
