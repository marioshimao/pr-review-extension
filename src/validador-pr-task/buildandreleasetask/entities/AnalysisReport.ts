import { CodeIssue } from './CodeIssue';

/**
 * Representa um relatório de análise de código
 * Esta entidade armazena o resultado completo de uma análise, incluindo todos os problemas encontrados
 */
export class AnalysisReport {
    private readonly issues: CodeIssue[];
    private readonly timestamp: Date;

    /**
     * Construtor para a classe AnalysisReport
     * @param issues - Lista de problemas encontrados durante a análise
     */
    constructor(issues: CodeIssue[] = []) {
        this.issues = [...issues]; // Cópia defensiva
        this.timestamp = new Date();
    }

    /**
     * Obtém a lista de problemas encontrados
     * @returns Array de CodeIssue
     */
    public getIssues(): CodeIssue[] {
        return [...this.issues]; // Retorna cópia para evitar modificações externas
    }

    /**
     * Verifica se o relatório contém problemas
     * @returns true se existem problemas, false caso contrário
     */
    public hasIssues(): boolean {
        return this.issues.length > 0;
    }

    /**
     * Obtém o número de problemas no relatório
     * @returns Número de problemas
     */
    public getIssueCount(): number {
        return this.issues.length;
    }

    /**
     * Gera o conteúdo do relatório em formato Markdown
     * @returns String contendo o relatório formatado
     */
    public generateMarkdownReport(): string {
        let report = '# Relatório de Análise de Código\n\n';
        
        if (this.issues.length === 0) {
            report += '✅ Todas as melhores práticas e regras foram seguidas.\n';
        } else {
            report += `## Problemas Encontrados (${this.issues.length})\n\n`;
            
            this.issues.forEach(issue => {
                report += `- ${issue.toString()}\n`;
            });
        }

        report += `\n\n*Gerado em: ${this.timestamp.toLocaleString()}*`;
        
        return report;
    }
}
