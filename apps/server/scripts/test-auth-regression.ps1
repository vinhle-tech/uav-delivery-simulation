$secret = Read-Host 'Password for operator@example.invalid' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $env:AUTH_TEST_EMAIL = 'operator@example.invalid'
    $env:AUTH_TEST_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    node (Join-Path $PSScriptRoot '../tests/auth-business-regression.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'Authenticated business regression failed' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    Remove-Item Env:AUTH_TEST_EMAIL, Env:AUTH_TEST_PASSWORD -ErrorAction SilentlyContinue
    $secret.Dispose()
}
