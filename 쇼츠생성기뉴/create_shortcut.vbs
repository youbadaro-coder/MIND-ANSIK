Set oWS = WScript.CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")
' Fallback if SpecialFolders fails in high-restricted environments
If sDesktop = "" Then sDesktop = "C:\Users\USER\OneDrive\Desktop"

sProjectDir = "c:\ai작업\anti\쇼츠생성기뉴"
sShortcutPath = sDesktop & "\Shorts Factory Pro.lnk"

Set oShortcut = oWS.CreateShortcut(sShortcutPath)
oShortcut.TargetPath = sProjectDir & "\run_nova.bat"
oShortcut.WorkingDirectory = sProjectDir
oShortcut.IconLocation = sProjectDir & "\icon.ico"
oShortcut.Save

WScript.Echo "✅ Desktop Shortcut Created Successfully!"
