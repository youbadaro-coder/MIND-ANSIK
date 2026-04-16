Set oWS = WScript.CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")
If sDesktop = "" Then sDesktop = "C:\Users\USER\OneDrive\Desktop"

sProjectDir = "c:\ai작업\anti\신사업구상 Antigravity AI Studio"
sShortcutPath = sDesktop & "\AI Studio.lnk"

Set oShortcut = oWS.CreateShortcut(sShortcutPath)
oShortcut.TargetPath = sProjectDir & "\슈퍼_스튜디오_실행.bat"
oShortcut.WorkingDirectory = sProjectDir
oShortcut.Save

WScript.Echo "✅ AI Studio Shortcut Repaired Successfully!"
