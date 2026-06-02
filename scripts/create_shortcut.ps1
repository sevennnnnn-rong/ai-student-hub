$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('C:\Users\lenovo\Desktop\气象台Hub.lnk')
$sc.TargetPath = 'D:\Software\ai-student-hub\src-tauri\target\release\ai-student-hub.exe'
$sc.WorkingDirectory = 'D:\Software\ai-student-hub\src-tauri\target\release'
$sc.IconLocation = 'D:\Software\ai-student-hub\src-tauri\icons\icon.ico'
$sc.Save()
Write-Output "Shortcut created"
