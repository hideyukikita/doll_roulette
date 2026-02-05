# Connect-WSL.ps1
# WSL2 で動いているアプリをスマホからアクセスできるように、Windows のポート転送を設定する
# 管理者として PowerShell を開いて実行すること
#
# 注意: WSL2 の IP は再起動で変わるため、PC や WSL2 を再起動したあとはこのスクリプトを再実行すること

# Reset previous proxy
netsh interface portproxy reset

# Get WSL2 IP Address
$wslIP = (wsl hostname -I).Trim().Split(" ")[0]

if (-not $wslIP) {
    Write-Host "Error: Could not find WSL2 IP." -ForegroundColor Red
    exit 1
}

Write-Host "WSL2 IP: $wslIP" -ForegroundColor Green

# Set Port Forwarding
$ports = @("5173", "3000")

foreach ($port in $ports) {
    $command = "netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIP"
    Invoke-Expression $command
    Write-Host "Port $port forwarded to $wslIP" -ForegroundColor Green
}

Write-Host "Success! You can now access from your mobile." -ForegroundColor Cyan
Write-Host "Use Windows IP (ipconfig) for smartphone: http://<Windows_IP>:5173" -ForegroundColor Yellow
