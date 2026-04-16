import os
import win32com.client

desktop = r'C:\Users\USER\Desktop'
path = os.path.join(desktop, 'Shorts Factory Pro V2.lnk')
target = r'C:\ai작업\anti\쇼츠생성기뉴\run_nova.bat'
work_dir = r'C:\ai작업\anti\쇼츠생성기뉴'

shell = win32com.client.Dispatch("WScript.Shell")
shortcut = shell.CreateShortCut(path)
shortcut.Targetpath = target
shortcut.WorkingDirectory = work_dir
shortcut.save()

# Try to remove the old broken bats
for bad_bat in ['Shorts_Factory_Pro_LAUNCHER.bat', 'Shorts_Factory_Pro_LAUNCHER_fixed.bat']:
    try:
        os.remove(os.path.join(desktop, bad_bat))
    except Exception:
        pass

print("Shortcut created natively.")
