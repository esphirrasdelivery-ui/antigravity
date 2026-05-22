# Registra o reminder no Agendador de Tarefas do Windows
# Execute uma vez com: powershell -ExecutionPolicy Bypass -File instalar-tarefa-windows.ps1

$pasta  = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $pasta "server.js"
$node   = (Get-Command node -ErrorAction Stop).Source

$action  = New-ScheduledTaskAction -Execute $node -Argument "`"$script`"" -WorkingDirectory $pasta
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName   "Esphirras-Lembretes-Inventario" `
  -Action     $action `
  -Trigger    $trigger `
  -Settings   $settings `
  -RunLevel   Limited `
  -Force

Write-Host "✅ Tarefa agendada! O sistema de lembretes vai iniciar automaticamente ao ligar o PC."
Write-Host "   Para remover: Unregister-ScheduledTask -TaskName 'Esphirras-Lembretes-Inventario' -Confirm:`$false"
