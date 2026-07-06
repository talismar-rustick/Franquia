$dir = "c:\Users\Talis PC\Desktop\Franquia"
$portal = $dir
if (-not (Test-Path $portal)) { New-Item -ItemType Directory -Path $portal | Out-Null }

$htmlFiles = Get-ChildItem -Path $dir -Filter "*.html" | Where-Object { $_.Name -ne "index.html" }
$db = @()

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $franchiseName = $file.BaseName
    
    $regex = '(?i)<tr[^>]*>([\s\S]*?)</tr>'
    $stores = @()
    
    $matches = [regex]::Matches($content, $regex)
    foreach ($match in $matches) {
        $row = $match.Groups[1].Value
        $tdRegex = '(?i)<td[^>]*>(.*?)</td>'
        $tdMatches = [regex]::Matches($row, $tdRegex)
        
        if ($tdMatches.Count -ge 3) {
            # Limpar tags HTML dos TDs
            $id = $tdMatches[0].Groups[1].Value -replace '<[^>]*>', ''
            $name = $tdMatches[1].Groups[1].Value -replace '<[^>]*>', ''
            $city = $tdMatches[2].Groups[1].Value -replace '<[^>]*>', ''
            
            # Substituir entidades HTML, como &nbsp; ou apenas focar no texto
            $id = $id.Trim()
            $name = $name.Trim()
            $city = $city.Trim()
            
            # Verificar se é um ID hexadecimal válido de 24 caracteres (formato do MongoDB)
            if ($id.Length -eq 24 -and $id -match '^[0-9a-fA-F]+$') {
                $stores += @{
                    id = $id
                    name = $name
                    city = $city
                }
            }
        }
    }
    
    if ($stores.Count -gt 0) {
        $db += @{
            franchise = $franchiseName
            stores = $stores
        }
    }
}

$json = $db | ConvertTo-Json -Depth 10 -Compress
# Remover os escapes unicode se houver, ou manter padrao
$jsContent = "const franquiasData = $json;"

# Salvar como UTF-8
Set-Content -Path "$portal\data.js" -Value $jsContent -Encoding UTF8
Write-Output "Banco de dados gerado em $portal\data.js com sucesso!"
