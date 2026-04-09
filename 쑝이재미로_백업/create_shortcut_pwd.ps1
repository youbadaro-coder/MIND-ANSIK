$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\FittingApp.lnk")
$Shortcut.TargetPath = "$($PWD.Path)\start_app.bat"
$Shortcut.WorkingDirectory = "$($PWD.Path)"
$Shortcut.IconLocation = "shell32.dll,249"
$Shortcut.WindowStyle = 1
$Shortcut.Save()
Write-Output "Shortcut successfully created using dynamic path: $($PWD.Path)"
