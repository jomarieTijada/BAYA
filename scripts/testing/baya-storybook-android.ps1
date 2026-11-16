param([Parameter(Mandatory=$true)][string]$Serial)
$ErrorActionPreference = 'Stop'
$state = & adb -s $Serial get-state
if ($state -ne 'device') { throw 'Connect an authorized device first.' }
if ((& adb -s $Serial shell getprop ro.kernel.qemu) -eq '1') { throw 'Use physical hardware, not an emulator.' }
$device = [ordered]@{
  manufacturer = (& adb -s $Serial shell getprop ro.product.manufacturer).Trim()
  model = (& adb -s $Serial shell getprop ro.product.model).Trim()
  android = (& adb -s $Serial shell getprop ro.build.version.release).Trim()
  display = (& adb -s $Serial shell wm size) -join "`n"
  browser = ((& adb -s $Serial shell dumpsys package com.android.chrome) | Select-String 'versionName=' | Select-Object -First 1).ToString().Trim()
  memory = ((& adb -s $Serial shell cat /proc/meminfo) | Select-String '^MemTotal:').ToString().Trim()
}
$evidence = 'docs/verification/baya-storybook-final/physical'
New-Item -ItemType Directory -Force -Path $evidence | Out-Null
$device | ConvertTo-Json | Set-Content "$evidence/device.json"
$env:BAYA_ANDROID_SERIAL = $Serial
$env:BAYA_STORYBOOK_OUTPUT = $evidence
try { node scripts/testing/baya-storybook-final.mjs; if ($LASTEXITCODE -ne 0) { throw 'Device browser checks failed; inspect the report.' } }
finally { Remove-Item Env:BAYA_ANDROID_SERIAL; Remove-Item Env:BAYA_STORYBOOK_OUTPUT }
