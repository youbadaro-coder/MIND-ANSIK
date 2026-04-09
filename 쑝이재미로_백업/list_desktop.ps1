$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
# 바탕화면 전체 파일 목록 출력
Get-ChildItem -Path "$DesktopPath" | Select-Object Name | Out-File -FilePath "d:\ai작업\anti\쑝이재미로\desktop_files.txt" -Encoding utf8
