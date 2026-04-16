$projectDir = $PSScriptRoot
$WshShell = New-Object -ComObject WScript.Shell
$desktop = $WshShell.SpecialFolders.Item("Desktop")
if ($desktop -eq $null -or $desktop -eq "") { 
    $desktop = [Environment]::GetFolderPath('Desktop')
}
$Shortcut = $WshShell.CreateShortcut("$desktop\Shorts Factory Pro.lnk")
$Shortcut.TargetPath = "$projectDir\run_nova.bat"
$Shortcut.WorkingDirectory = "$projectDir"
$Shortcut.IconLocation = "$projectDir\icon.ico"
$Shortcut.Save()
Write-Host "✅ Desktop Shortcut Successfully Created!"
