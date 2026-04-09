$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\FittingApp.lnk")
$Shortcut.TargetPath = 'D:\ai작업\anti\쑝이재미로\start_app.bat'
$Shortcut.WorkingDirectory = 'D:\ai작업\anti\쑝이재미로\'
$Shortcut.IconLocation = 'shell32.dll,249'
$Shortcut.WindowStyle = 1
$Shortcut.Save()
Write-Output "Success"
