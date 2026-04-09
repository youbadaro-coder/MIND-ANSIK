$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "YoungFitting_Temp.lnk"

# Check if file exists
if (Test-Path $ShortcutPath) {
    # [영피팅].lnk
    # 영: 0xC601 (50689)
    # 피: 0xD53C (54588)
    # 팅: 0xD305 (54021)
    $NewName = "[" + [Char]50689 + [Char]54588 + [Char]54021 + "].lnk"
    
    # Try renaming with -LiteralPath to avoid globbing on []
    Rename-Item -LiteralPath $ShortcutPath -NewName $NewName -Force
    Write-Output "Renamed to $NewName"
} else {
    Write-Output "Could not find $ShortcutPath"
}
