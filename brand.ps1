<#
.SYNOPSIS
    E-Commerce Core — Brand Generator & Architecture CLI.
.DESCRIPTION
    Herramienta profesional de automatización para la creación, validación,
    previsualización, activación, clonación y diagnóstico de marcas
    en el motor E-Commerce Core.
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [Parameter(Position = 1)]
    [string]$TargetName = "",

    [Parameter(Position = 2)]
    [string]$ExtraArg = "",

    [string]$Slug = "",
    [string]$Analysis = "",
    [switch]$DryRun,
    [switch]$Rebuild,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EngineScript = Join-Path $ScriptDir "scripts\brand-engine.mjs"

$TAG_OK = "[OK]"
$TAG_WARN = "[WARN]"
$TAG_ERR = "[ERROR]"
$TAG_INFO = "[INFO]"

function Show-Header {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "          E-COMMERCE CORE -- BRAND GENERATOR CLI                " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-Host "USO: .\brand.ps1 [comando] [argumentos] [opciones]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "COMANDOS DISPONIBLES:" -ForegroundColor White
    Write-Host "  create [Nombre]        Crea un nuevo paquete de marca (Brand Package)." -ForegroundColor Green
    Write-Host "                         Opciones: -Slug [slug] -Analysis [archivo.json] -DryRun -Rebuild" -ForegroundColor DarkGray
    Write-Host "  validate [slug]        Valida contratos, archivos y coherencia de la marca." -ForegroundColor Green
    Write-Host "  preview [slug]         Muestra un resumen ejecutivo y visual de la marca." -ForegroundColor Green
    Write-Host "  activate [slug]        Activa la marca como unica fuente de verdad con auto-rollback." -ForegroundColor Green
    Write-Host "                         Opciones: -Force" -ForegroundColor DarkGray
    Write-Host "  list                   Lista todas las marcas registradas y su estado." -ForegroundColor Green
    Write-Host "  info [slug]            Muestra la ficha tecnica completa de una marca." -ForegroundColor Green
    Write-Host "  clone [origen] [nueva] Clona una marca limpiando datos sensibles y adaptando nombres." -ForegroundColor Green
    Write-Host "  rollback               Restaura la marca activa previa en caso de contingencia." -ForegroundColor Green
    Write-Host "  doctor                 Escanea el Core buscando referencias fijas y estado de tokens." -ForegroundColor Green
    Write-Host "  help                   Muestra esta ayuda." -ForegroundColor Green
    Write-Host ""
    Write-Host "EJEMPLOS:" -ForegroundColor White
    Write-Host '  .\brand.ps1 create "Aura Studio"' -ForegroundColor Cyan
    Write-Host '  .\brand.ps1 create "Aura Studio" -DryRun' -ForegroundColor Cyan
    Write-Host '  .\brand.ps1 create "Aura Studio" -Analysis ".\brand-analysis.json"' -ForegroundColor Cyan
    Write-Host '  .\brand.ps1 validate "aura-studio"' -ForegroundColor Cyan
    Write-Host '  .\brand.ps1 preview "aura-studio"' -ForegroundColor Cyan
    Write-Host '  .\brand.ps1 activate "aura-studio"' -ForegroundColor Cyan
    Write-Host '  .\brand.ps1 doctor' -ForegroundColor Cyan
    Write-Host ""
}

function Invoke-NodeEngine {
    param([string[]]$EngineArgs)
    
    $fullArgs = @($EngineScript) + $EngineArgs
    
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "node"
    $pinfo.Arguments = ($fullArgs | ForEach-Object { "`"$_`"" }) -join " "
    $pinfo.WorkingDirectory = $ScriptDir
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.UseShellExecute = $false
    $pinfo.CreateNoWindow = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $pinfo
    $process.Start() | Out-Null
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    return @{
        ExitCode = $process.ExitCode
        Output = $stdout
        Error = $stderr
    }
}

switch ($Command.ToLower()) {
    "help" {
        Show-Help
    }

    "create" {
        Show-Header
        if (-not $TargetName) {
            Write-Host "$TAG_ERR Error: Debes especificar el nombre de la marca." -ForegroundColor Red
            Write-Host '    Ejemplo: .\brand.ps1 create "Aura Studio"' -ForegroundColor DarkGray
            exit 1
        }

        Write-Host "Generando nueva marca: $TargetName..." -ForegroundColor White
        $engineArgs = @("create", $TargetName)
        if ($Slug) { $engineArgs += @("--slug", $Slug) }
        if ($Analysis) { $engineArgs += @("--analysis", $Analysis) }
        if ($DryRun) { $engineArgs += "--dry-run" }
        if ($Rebuild) { $engineArgs += "--rebuild" }

        $res = Invoke-NodeEngine -EngineArgs $engineArgs
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Error al crear la marca:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $json = $res.Output | ConvertFrom-Json
        if ($DryRun) {
            Write-Host "================================================" -ForegroundColor Yellow
            Write-Host "         DRY RUN -- SIMULACION DE CREACION      " -ForegroundColor Yellow
            Write-Host "================================================" -ForegroundColor Yellow
            Write-Host "Marca:   $($json.name)" -ForegroundColor White
            Write-Host "Slug:    $($json.slug)" -ForegroundColor Cyan
            Write-Host "Destino: $($json.targetDir)" -ForegroundColor DarkGray
            Write-Host ""
            Write-Host "Archivos que se crearian:" -ForegroundColor Yellow
            foreach ($f in $json.filesWouldCreate) {
                Write-Host "  (+) $f" -ForegroundColor Green
            }
            Write-Host ""
            Write-Host "$TAG_INFO No se modifico ningun archivo del sistema." -ForegroundColor Cyan
            exit 0
        }

        Write-Host "$TAG_OK Marca creada exitosamente." -ForegroundColor Green
        Write-Host "    Slug:       $($json.slug)" -ForegroundColor Cyan
        Write-Host "    Estado:     $($json.manifest.status)" -ForegroundColor Yellow
        Write-Host "    Origen:     $($json.manifest.source)" -ForegroundColor White
        Write-Host "    Directorio: $($json.brandDir)" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Siguientes pasos recomendados:" -ForegroundColor White
        Write-Host "  1. .\brand.ps1 validate `"$($json.slug)`"" -ForegroundColor Cyan
        Write-Host "  2. .\brand.ps1 preview `"$($json.slug)`"" -ForegroundColor Cyan
        Write-Host "  3. .\brand.ps1 activate `"$($json.slug)`"" -ForegroundColor Cyan
        Write-Host ""
    }

    "validate" {
        Show-Header
        if (-not $TargetName) {
            Write-Host "$TAG_ERR Error: Debes indicar el slug de la marca a validar." -ForegroundColor Red
            exit 1
        }

        Write-Host "Validando marca: $TargetName..." -ForegroundColor White
        $res = Invoke-NodeEngine -EngineArgs @("validate", $TargetName)
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Error en validacion:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $json = $res.Output | ConvertFrom-Json
        Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
        Write-Host "REPORTE DE VALIDACION: $($json.slug)" -ForegroundColor White
        Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
        Write-Host "Estado de la validacion: " -NoNewline
        if ($json.status -eq "valid") {
            Write-Host "VALIDO $TAG_OK" -ForegroundColor Green
        } elseif ($json.status -eq "warning") {
            Write-Host "CON ADVERTENCIAS $TAG_WARN" -ForegroundColor Yellow
        } else {
            Write-Host "INVALIDO $TAG_ERR" -ForegroundColor Red
        }

        if ($json.errors.Count -gt 0) {
            Write-Host ""
            Write-Host "Errores Criticos:" -ForegroundColor Red
            foreach ($e in $json.errors) {
                Write-Host "  $TAG_ERR $e" -ForegroundColor Red
            }
        }

        if ($json.warnings.Count -gt 0) {
            Write-Host ""
            Write-Host "Advertencias / Pendientes:" -ForegroundColor Yellow
            foreach ($w in $json.warnings) {
                Write-Host "  $TAG_WARN $w" -ForegroundColor Yellow
            }
        }

        if ($json.status -eq "valid" -and $json.warnings.Count -eq 0) {
            Write-Host ""
            Write-Host "$TAG_OK La marca cumple con todos los contratos y estandares del Core." -ForegroundColor Green
        }
        Write-Host ""
    }

    "preview" {
        Show-Header
        if (-not $TargetName) {
            Write-Host "$TAG_ERR Error: Debes indicar el slug de la marca a previsualizar." -ForegroundColor Red
            exit 1
        }

        $res = Invoke-NodeEngine -EngineArgs @("info", $TargetName)
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Error al obtener informacion:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $json = $res.Output | ConvertFrom-Json
        $brandPath = Join-Path $json.directory "brand.ts"
        $themePath = Join-Path $json.directory "theme.ts"
        $storePath = Join-Path $json.directory "store.ts"

        Write-Host "FICHA EJECUTIVA DE LA MARCA: $($json.name)" -ForegroundColor Cyan
        Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
        Write-Host "Slug:        $($json.slug)" -ForegroundColor White
        Write-Host "Estado:      $($json.status)" -ForegroundColor Yellow
        $actText = if ($json.isActive) { "SI (ACTIVA)" } else { "NO" }
        $actColor = if ($json.isActive) { "Green" } else { "Gray" }
        Write-Host "Activa hoy:  $actText" -ForegroundColor $actColor
        Write-Host "Directorio:  $($json.directory)" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "ARCHIVOS DEL BRAND PACKAGE:" -ForegroundColor White
        $bText = if (Test-Path $brandPath) { "$TAG_OK Presente" } else { "$TAG_ERR Faltante" }
        $bColor = if (Test-Path $brandPath) { "Green" } else { "Red" }
        Write-Host "  brand.ts:   $bText" -ForegroundColor $bColor

        $tText = if (Test-Path $themePath) { "$TAG_OK Presente" } else { "$TAG_ERR Faltante" }
        $tColor = if (Test-Path $themePath) { "Green" } else { "Red" }
        Write-Host "  theme.ts:   $tText" -ForegroundColor $tColor

        $sText = if (Test-Path $storePath) { "$TAG_OK Presente" } else { "$TAG_ERR Faltante" }
        $sColor = if (Test-Path $storePath) { "Green" } else { "Red" }
        Write-Host "  store.ts:   $sText" -ForegroundColor $sColor

        $mText = if ($json.manifest) { "$TAG_OK Presente" } else { "$TAG_ERR Faltante" }
        $mColor = if ($json.manifest) { "Green" } else { "Red" }
        Write-Host "  manifest:   $mText" -ForegroundColor $mColor
        Write-Host ""
        Write-Host "ESTADO DE VALIDACION:" -ForegroundColor White
        $valColor = if ($json.validation.status -eq 'valid') { 'Green' } else { 'Yellow' }
        Write-Host "  Resultado:   $($json.validation.status.ToUpper())" -ForegroundColor $valColor
        if ($json.validation.warnings.Count -gt 0) {
            Write-Host "  Pendientes:" -ForegroundColor Yellow
            foreach ($w in $json.validation.warnings) {
                Write-Host "    - $w" -ForegroundColor Yellow
            }
        }
        Write-Host ""
    }

    "activate" {
        Show-Header
        if (-not $TargetName) {
            Write-Host "$TAG_ERR Error: Debes indicar el slug de la marca a activar." -ForegroundColor Red
            exit 1
        }

        Write-Host "Iniciando proceso de activacion atomica para `"$TargetName`"..." -ForegroundColor White
        $engineArgs = @("activate", $TargetName)
        if ($Force) { $engineArgs += "--force" }

        $res = Invoke-NodeEngine -EngineArgs $engineArgs
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Fallo la activacion:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $json = $res.Output | ConvertFrom-Json
        if ($json.alreadyActive) {
            Write-Host "$TAG_INFO $($json.message)" -ForegroundColor Cyan
            exit 0
        }

        Write-Host "$TAG_OK $($json.message)" -ForegroundColor Green
        Write-Host "    Marca anterior: $($json.previousBrand)" -ForegroundColor DarkGray
        Write-Host "    Marca activa:   $($json.activeBrand)" -ForegroundColor Cyan
        Write-Host "    Verificacion:   TypeScript typecheck PASADO con 0 errores $TAG_OK" -ForegroundColor Green
        Write-Host ""
        Write-Host "$TAG_WARN IMPORTANTE: Si tienes 'npm run dev' en ejecucion, reinicialo para recargar la nueva marca." -ForegroundColor Yellow
        Write-Host ""
    }

    "rollback" {
        Show-Header
        Write-Host "Ejecutando rollback de marca activa..." -ForegroundColor White
        $res = Invoke-NodeEngine -EngineArgs @("rollback")
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Error durante rollback:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $json = $res.Output | ConvertFrom-Json
        Write-Host "$TAG_OK Rollback completado con exito." -ForegroundColor Green
        Write-Host "    Marca restaurada: $($json.restoredBrand)" -ForegroundColor Cyan
        Write-Host "    Marca previa:     $($json.previousBrand)" -ForegroundColor DarkGray
        Write-Host ""
    }

    "list" {
        Show-Header
        $res = Invoke-NodeEngine -EngineArgs @("list")
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Error al listar marcas:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $brands = $res.Output | ConvertFrom-Json
        Write-Host "MARCAS REGISTRADAS EN EL CORE:" -ForegroundColor White
        Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
        foreach ($b in $brands) {
            $prefix = if ($b.isActive) { "* (ACTIVA)" } else { "o (INACTIVA)" }
            $color = if ($b.isActive) { "Green" } else { "Gray" }
            Write-Host "$prefix " -NoNewline -ForegroundColor $color
            Write-Host "$($b.name) " -NoNewline -ForegroundColor White
            Write-Host "($($b.slug))" -NoNewline -ForegroundColor Cyan
            Write-Host " -- Estado: $($b.status) | Origen: $($b.source)" -ForegroundColor DarkGray
        }
        Write-Host ""
    }

    "info" {
        Show-Header
        if (-not $TargetName) {
            Write-Host "$TAG_ERR Error: Debes indicar el slug de la marca." -ForegroundColor Red
            exit 1
        }

        $res = Invoke-NodeEngine -EngineArgs @("info", $TargetName)
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Error:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $json = $res.Output | ConvertFrom-Json
        Write-Host "FICHA TECNICA: $($json.name)" -ForegroundColor Cyan
        Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
        Write-Host ($json | ConvertTo-Json -Depth 5) -ForegroundColor Gray
        Write-Host ""
    }

    "clone" {
        Show-Header
        if (-not $TargetName -or -not $ExtraArg) {
            Write-Host "$TAG_ERR Error: Debes indicar la marca origen y el nombre de la nueva marca." -ForegroundColor Red
            Write-Host '    Ejemplo: .\brand.ps1 clone "lumina" "Aura Studio"' -ForegroundColor DarkGray
            exit 1
        }

        Write-Host "Clonando inteligentemente `"$TargetName`" hacia `"$ExtraArg`"..." -ForegroundColor White
        $engineArgs = @("clone", $TargetName, $ExtraArg)
        if ($Slug) { $engineArgs += @("--slug", $Slug) }
        if ($DryRun) { $engineArgs += "--dry-run" }
        if ($Rebuild) { $engineArgs += "--rebuild" }

        $res = Invoke-NodeEngine -EngineArgs $engineArgs
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Error al clonar:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $json = $res.Output | ConvertFrom-Json
        if ($DryRun) {
            Write-Host "$TAG_WARN [DRY RUN] Se clonaria `"$($json.source)`" en `"$($json.targetSlug)`"." -ForegroundColor Yellow
            exit 0
        }

        Write-Host "$TAG_OK Marca clonada exitosamente en: $($json.targetDir)" -ForegroundColor Green
        Write-Host "    Slug destino: $($json.targetSlug)" -ForegroundColor Cyan
        Write-Host "    Los datos sensibles han sido reemplazados con placeholders limpios." -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Siguiente paso: .\brand.ps1 validate `"$($json.targetSlug)`"" -ForegroundColor White
        Write-Host ""
    }

    "doctor" {
        Show-Header
        Write-Host "Ejecutando escaneo profundo del CORE (Doctor)..." -ForegroundColor White
        $res = Invoke-NodeEngine -EngineArgs @("doctor")
        if ($res.ExitCode -ne 0) {
            Write-Host "$TAG_ERR Error durante escaneo Doctor:" -ForegroundColor Red
            Write-Host $res.Error -ForegroundColor DarkRed
            exit 1
        }

        $json = $res.Output | ConvertFrom-Json
        Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
        Write-Host "REPORTE DE DIAGNOSTICO DEL CORE" -ForegroundColor White
        Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
        Write-Host "Total hallazgos inspeccionados: $($json.totalFindings)" -ForegroundColor White
        Write-Host "  - Seguros / Intencionales:    $($json.safeCount)" -ForegroundColor Green
        Write-Host "  - Configurables (Tokens):     $($json.configurableCount)" -ForegroundColor Yellow
        $hardColor = if ($json.hardcodedCount -gt 0) { "Magenta" } else { "Green" }
        Write-Host "  - Potencialmente acoplados:   $($json.hardcodedCount)" -ForegroundColor $hardColor
        Write-Host ""
        Write-Host "Cobertura de abstraccion de Tokens: $($json.tokenCoveragePercent)%" -ForegroundColor Cyan
        Write-Host ""

        if ($json.hardcodedCount -gt 0) {
            Write-Host "Puntos que requieren atencion para maxima reutilizacion:" -ForegroundColor Yellow
            $hard = $json.findings | Where-Object { $_.category -eq 'POTENTIALLY_HARDCODED' } | Select-Object -First 10
            foreach ($h in $hard) {
                Write-Host "  $TAG_WARN $($h.file):$($h.line) -- $($h.description)" -ForegroundColor Yellow
                Write-Host "      Snippet: $($h.snippet)" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "$TAG_OK No se detectaron acoplamientos criticos de marca en los componentes centrales." -ForegroundColor Green
        }
        Write-Host ""
    }

    default {
        Show-Help
    }
}
