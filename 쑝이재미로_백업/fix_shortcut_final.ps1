$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$LinkPath = "$DesktopPath\FittingApp.lnk"

# 기존에 깨진 글자가 남아있는 바로가기를 완전히 삭제합니다.
if (Test-Path $LinkPath) {
    Remove-Item -Path $LinkPath -Force
}

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($LinkPath)

# 깨짐 없는 동적 경로($PWD.Path)를 사용하여 대상을 지정하고 이전 인수를 초기화합니다.
$Shortcut.TargetPath = "$($PWD.Path)\start_app.bat"
$Shortcut.Arguments = ""
$Shortcut.WorkingDirectory = "$($PWD.Path)"
$Shortcut.IconLocation = "shell32.dll,249"
$Shortcut.WindowStyle = 1
$Shortcut.Save()

Write-Output "Clean shortcut successfully created!"
