$projectDir = $PSScriptRoot
$WshShell = New-Object -ComObject WScript.Shell
$desktop = $WshShell.SpecialFolders.Item("Desktop")
if ($desktop -eq $null -or $desktop -eq "") { $desktop = [Environment]::GetFolderPath('Desktop') }

$Shortcut = $WshShell.CreateShortcut("$desktop\AI Studio.lnk")
$Shortcut.TargetPath = "$projectDir\studio_launcher.bat"
$Shortcut.WorkingDirectory = "$projectDir"
$Shortcut.Save()
Write-Host "✅ AI Studio Shortcut Created Successfully!"
