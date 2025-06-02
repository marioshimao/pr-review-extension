# Script para empacotar e publicar a extensão no Azure DevOps Marketplace
# Certifique-se de ter instalado o TFX CLI (npm install -g tfx-cli)

# Navegar até a pasta da extensão
Write-Host "Navegando até a pasta da extensão..." -ForegroundColor Cyan
Set-Location -Path "src\validador-pr-task"

# Limpar qualquer arquivo .vsix anterior
Get-ChildItem -Path "." -Filter "*.vsix" | Remove-Item

# Empacotar a extensão como pública
Write-Host "Empacotando a extensão como pública..." -ForegroundColor Green
tfx extension create --manifest-globs vss-extension.json --rev-version

# Verificar se o empacotamento foi bem-sucedido
if ($LASTEXITCODE -eq 0) {
    $vsixFile = Get-ChildItem -Path "." -Filter "*.vsix" | Select-Object -First 1
    Write-Host "Extensão empacotada com sucesso: $($vsixFile.Name)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Acesse https://marketplace.visualstudio.com/manage/publishers" -ForegroundColor Yellow
    Write-Host "2. Faça login com sua conta Microsoft associada ao publisher" -ForegroundColor Yellow
    Write-Host "3. Publique o arquivo VSIX gerado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Arquivo VSIX pronto para publicação: $($vsixFile.FullName)" -ForegroundColor Cyan
} else {
    Write-Host "Erro ao empacotar a extensão" -ForegroundColor Red
}
