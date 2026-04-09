$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
Get-ChildItem -Path "$DesktopPath" | Select-Object Name | Out-File -FilePath "C:\Users\allap\AppData\Local\Temp\desktop_files.txt" -Encoding utf8
