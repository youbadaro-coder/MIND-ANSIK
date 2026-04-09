$WshShell = New-Object -comObject WScript.Shell
$Desktop = 'C:\Users\allap\OneDrive\바탕 화면'
$Shortcut = $WshShell.CreateShortcut("$Desktop\Shorts Factory.lnk")
Write-Output "Target: $($Shortcut.TargetPath)"
Write-Output "Args: $($Shortcut.Arguments)"
Write-Output "WorkingDir: $($Shortcut.WorkingDirectory)"
