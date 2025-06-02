"use strict";
/**
 * Ponto de entrada principal da task
 * Esta implementação segue os princípios da Arquitetura Limpa (Clean Architecture)
 *
 * A estrutura do código está organizada em camadas:
 * - Entidades: Objetos de negócio (CodeIssue, AnalysisReport)
 * - Casos de Uso: Implementam a lógica de negócio (AnalyzeCodeUseCase, ReportPullRequestIssuesUseCase)
 * - Interfaces: Definem contratos para adaptadores (IRepository, ICodeAnalyzer, IFileService, ILogService)
 * - Adaptadores: Implementam as interfaces para acessar recursos externos (AzureDevOpsRepository, OpenAICodeAnalyzer)
 * - Controladores: Coordenam os casos de uso (TaskController)
 * - Configuração: Gerencia dependências e configurações (ConfigService)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigService_1 = require("./config/ConfigService");
const TaskController_1 = require("./controllers/TaskController");
/**
 * Função principal que inicializa e executa a task
 */
async function run() {
    try {
        // Inicializar serviço de configuração
        const configService = new ConfigService_1.ConfigService();
        // Inicializar o controlador com as dependências necessárias
        const controller = new TaskController_1.TaskController(configService);
        // Executar a task
        await controller.execute();
    }
    catch (err) {
        console.error(`Erro fatal durante inicialização da task: ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    }
}
// Iniciar execução
run();
