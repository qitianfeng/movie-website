@echo off
setlocal enabledelayedexpansion

set API_KEY=2b6c741f47e63e7c6387ded2c0252181
set BASE_URL=https://api.themoviedb.org/3

echo ========================================
echo         TMDB API Test Tool
echo ========================================
echo.

echo [1] Testing API Connection...
curl -s "%BASE_URL%/configuration?api_key=%API_KEY%" -o response.json 2>nul
if exist response.json (
    echo     SUCCESS: Check response.json
) else (
    echo     FAILED: Cannot connect to TMDB
    echo     Possible: Network issue or need VPN
)
echo.

echo [2] Fetching Popular Movies...
curl -s "%BASE_URL%/movie/popular?api_key=%API_KEY%&language=en-US&page=1" -o movies.json 2>nul
if exist movies.json (
    echo     SUCCESS: Check movies.json
) else (
    echo     FAILED
)
echo.

echo [3] Fetching Genres...
curl -s "%BASE_URL%/genre/movie/list?api_key=%API_KEY%&language=en-US" -o genres.json 2>nul
if exist genres.json (
    echo     SUCCESS: Check genres.json
) else (
    echo     FAILED
)
echo.

echo ========================================
echo Test Complete! Check the JSON files.
echo ========================================
echo.
echo Files created:
echo   - response.json
echo   - movies.json
echo   - genres.json
echo.
pause
