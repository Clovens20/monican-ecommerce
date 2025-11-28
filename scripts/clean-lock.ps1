# Script pour nettoyer le fichier de verrou Next.js
$lockFile = ".next\dev\lock"
if (Test-Path $lockFile) {
    Write-Host "Suppression du fichier de verrou..." -ForegroundColor Yellow
    Remove-Item -Path $lockFile -Force
    Write-Host "Fichier de verrou supprimé avec succès!" -ForegroundColor Green
} else {
    Write-Host "Aucun fichier de verrou trouvé." -ForegroundColor Green
}

# Nettoyer aussi les processus Node.js orphelins si nécessaire
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Processus Node.js trouvés: $($nodeProcesses.Count)" -ForegroundColor Yellow
    Write-Host "Vous pouvez les arrêter manuellement si nécessaire." -ForegroundColor Yellow
}

