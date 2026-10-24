# Recebe JSON por stdin; caminhos nunca são interpolados como código PowerShell.
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$marker = 'catequese-sqlite-backup/v1'
$pattern = '^catequese-\d{8}T\d{12}Z-[0-9a-f]{8}\.sqlite3$'
$createdPartial = $false
$createdManifestPartial = $false

function Get-BackupHash([string]$Path) {
    $stream = [IO.File]::OpenRead($Path)
    $algorithm = [Security.Cryptography.SHA256]::Create()
    try {
        return ([BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '').ToLowerInvariant()
    } finally {
        $algorithm.Dispose()
        $stream.Dispose()
    }
}

try {
    $source = (Get-Item -LiteralPath $payload.source).FullName
    $filename = [IO.Path]::GetFileName($source)
    if ($filename -notmatch $pattern) { throw 'Nome de backup não reconhecido.' }
    $metadataSource = [IO.Path]::ChangeExtension($source, '.json')
    $metadata = Get-Content -LiteralPath $metadataSource -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($metadata.application -ne $marker -or $metadata.filename -ne $filename) {
        throw 'Manifesto de backup não reconhecido.'
    }
    if (-not [IO.Path]::IsPathRooted($payload.destination)) { throw 'O destino deve ser absoluto.' }
    $directory = [IO.Path]::GetFullPath($payload.destination).TrimEnd('\')
    $parent = [IO.Path]::GetDirectoryName($directory)
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
        throw 'A pasta sincronizada não está disponível. A cópia local foi preservada.'
    }
    if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
        New-Item -ItemType Directory -Path $directory | Out-Null
    }
    $target = Join-Path -Path $directory -ChildPath $filename
    $manifestTarget = [IO.Path]::ChangeExtension($target, '.json')
    $partial = $target + '.partial'
    $manifestPartial = $manifestTarget + '.partial'
    foreach ($candidate in @($target, $manifestTarget, $partial, $manifestPartial)) {
        if ([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($candidate)) -ine $directory) {
            throw 'Caminho fora da pasta de backup. Operação cancelada.'
        }
        if (Test-Path -LiteralPath $candidate) { throw "Arquivo já existe: $candidate" }
    }
    Copy-Item -LiteralPath $source -Destination $partial
    $createdPartial = $true
    $hash = Get-BackupHash $partial
    if ($hash -ne $metadata.sha256) { throw 'Checksum da cópia externa não confere.' }
    Copy-Item -LiteralPath $metadataSource -Destination $manifestPartial
    $createdManifestPartial = $true
    Move-Item -LiteralPath $partial -Destination $target
    Move-Item -LiteralPath $manifestPartial -Destination $manifestTarget

    $cutoff = [DateTimeOffset]::UtcNow.AddDays(-[int]$payload.retention_days)
    foreach ($file in (Get-ChildItem -LiteralPath $directory -File)) {
        if ($file.Name -notmatch $pattern) { continue }
        if (($file.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
        $filePath = [IO.Path]::GetFullPath($file.FullName)
        $manifestPath = [IO.Path]::ChangeExtension($filePath, '.json')
        if ([IO.Path]::GetDirectoryName($filePath) -ine $directory) { continue }
        if ([IO.Path]::GetDirectoryName($manifestPath) -ine $directory) { continue }
        if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { continue }
        try {
            $old = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($old.application -eq $marker -and $old.filename -eq $file.Name -and
                [DateTimeOffset]::Parse($old.created_at) -lt $cutoff) {
                Remove-Item -LiteralPath $filePath
                Remove-Item -LiteralPath $manifestPath
            }
        } catch {
            # Arquivos sem identificação válida são preservados.
        }
    }
    @{path=$target; sha256=$hash; verified=$true; sync_status='written_to_sync_folder'} | ConvertTo-Json -Compress
} catch {
    if ($createdPartial -and (Test-Path -LiteralPath $partial) -and
        [IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($partial)) -ieq $directory) {
        Remove-Item -LiteralPath $partial
    }
    if ($createdManifestPartial -and (Test-Path -LiteralPath $manifestPartial) -and
        [IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($manifestPartial)) -ieq $directory) {
        Remove-Item -LiteralPath $manifestPartial
    }
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
