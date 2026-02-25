# TMDB API Test Script
$ApiKey = "2b6c741f47e63e7c6387ded2c0252181"
$BaseUrl = "https://api.themoviedb.org/3"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        TMDB API Test Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: API Configuration
Write-Host "[1] Testing API Connection..." -ForegroundColor Yellow
try {
    $url1 = $BaseUrl + "/configuration?api_key=" + $ApiKey
    $response = Invoke-RestMethod -Uri $url1 -Method Get -TimeoutSec 30
    Write-Host "    SUCCESS: API Connected!" -ForegroundColor Green
    Write-Host "    Image Base URL: $($response.images.base_url)" -ForegroundColor Gray
} catch {
    Write-Host "    FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "  1. Network cannot access TMDB (need VPN)"
    Write-Host "  2. API Key is invalid"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""

# Test 2: Popular Movies
Write-Host "[2] Fetching Popular Movies..." -ForegroundColor Yellow
try {
    $url2 = $BaseUrl + "/movie/popular?api_key=" + $ApiKey + "&language=zh-CN&page=1"
    $movies = Invoke-RestMethod -Uri $url2 -Method Get -TimeoutSec 30
    Write-Host "    SUCCESS: Found $($movies.total_results) movies" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Top 5 Movies:" -ForegroundColor White
    $movies.results | Select-Object -First 5 | ForEach-Object {
        Write-Host "      - $($_.title) - Rating: $($_.vote_average)" -ForegroundColor Gray
    }
} catch {
    Write-Host "    FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Movie Genres
Write-Host "[3] Fetching Movie Genres..." -ForegroundColor Yellow
try {
    $url3 = $BaseUrl + "/genre/movie/list?api_key=" + $ApiKey + "&language=zh-CN"
    $genres = Invoke-RestMethod -Uri $url3 -Method Get -TimeoutSec 30
    Write-Host "    SUCCESS: Found $($genres.genres.Count) genres" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Genre List:" -ForegroundColor White
    $genres.genres | ForEach-Object {
        Write-Host "      - $($_.name) (ID: $($_.id))" -ForegroundColor Gray
    }
} catch {
    Write-Host "    FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
