param([ValidateSet('operator@example.invalid','admin@example.invalid')][string]$Email = 'operator@example.invalid')
$secret = Read-Host "Password for $Email" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $env:AUTH_TEST_EMAIL = $Email
    $env:AUTH_TEST_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    node (Join-Path $PSScriptRoot '../tests/protected-api-live.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Protected API live test failed' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    Remove-Item Env:AUTH_TEST_EMAIL, Env:AUTH_TEST_PASSWORD -ErrorAction SilentlyContinue
    $secret.Dispose()
}
