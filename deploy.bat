@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM  Smart Vision NPK - One-command deploy to GitHub + HF Space
REM  Usage:  deploy.bat
REM  Requires: GH_TOKEN and HF_TOKEN env vars (see deploy.md)
REM ============================================================

set "GH_BIN=%LOCALAPPDATA%\Programs\GitHubCLI\gh.exe"
set "HF_BIN=hf"
set "REPO_NAME=smart-vision-npk"
set "SPACE_NAME=smart-vision-npk"

if "%GH_TOKEN%"=="" (
  echo [ERROR] GH_TOKEN environment variable is not set.
  echo         Create one at https://github.com/settings/tokens (scope: repo)
  echo         then run:  set GH_TOKEN=ghp_xxxxxxxx
  exit /b 1
)
if "%HF_TOKEN%"=="" (
  echo [ERROR] HF_TOKEN environment variable is not set.
  echo         Create one at https://huggingface.co/settings/tokens (write)
  echo         then run:  set HF_TOKEN=hf_xxxxxxxx
  exit /b 1
)

echo.
echo [1/5] Checking tools...
if not exist "%GH_BIN%" (
  echo [ERROR] gh CLI not found. Install from https://cli.github.com
  exit /b 1
)
where %HF_BIN% >nul 2>&1
if errorlevel 1 (
  echo [ERROR] hf CLI not found. Run: pip install -U huggingface_hub
  exit /b 1
)
echo       OK

echo.
echo [2/5] Authenticating GitHub...
echo %GH_TOKEN% | "%GH_BIN%" auth login --with-token
if errorlevel 1 ( echo [ERROR] GitHub auth failed & exit /b 1 )
"%GH_BIN%" auth status >nul 2>&1
if errorlevel 1 ( echo [ERROR] GitHub auth verify failed & exit /b 1 )
for /f "delims=" %%u in ('"%GH_BIN%" api user --jq .login') do set "GH_USER=%%u"
echo       Logged in as %GH_USER%

echo.
echo [3/5] Authenticating Hugging Face...
set "HF_TOKEN=%HF_TOKEN%"
%HF_BIN% auth login --token %HF_TOKEN% >nul 2>&1
if errorlevel 1 (
  echo [INFO] Trying legacy login...
  huggingface-cli login --token %HF_TOKEN% >nul 2>&1
)
for /f "delims=" %%u in ('%HF_BIN% whoami 2^>nul') do set "HF_USER=%%u"
if "%HF_USER%"=="" (
  for /f "delims=" %%u in ('huggingface-cli whoami 2^>nul') do set "HF_USER=%%u"
)
if "%HF_USER%"=="" ( echo [WARN] Could not resolve HF username, continuing & set "HF_USER=__unknown__" )
echo       Logged in as %HF_USER%

echo.
echo [4/5] Creating and pushing GitHub repo...
"%GH_BIN%" repo view %GH_USER%/%REPO_NAME% >nul 2>&1
if errorlevel 1 (
  "%GH_BIN%" repo create %REPO_NAME% --public --source . --push --description "Smart Vision NPK - AI leaf deficiency detection"
  if errorlevel 1 ( echo [ERROR] GitHub repo create failed & exit /b 1 )
) else (
  git remote remove origin 2>nul
  git remote add origin https://github.com/%GH_USER%/%REPO_NAME%.git
  git push -u origin main
  if errorlevel 1 ( echo [ERROR] GitHub push failed & exit /b 1 )
)
echo       Repo: https://github.com/%GH_USER%/%REPO_NAME%

echo.
echo [5/5] Creating and pushing Hugging Face Space...
%HF_BIN% repo create %SPACE_NAME% --type space --sdk docker --private >nul 2>&1
if errorlevel 1 (
  echo [INFO] Space may already exist, continuing...
)
git remote remove space 2>nul
git remote add space https://huggingface.co/spaces/%HF_USER%/%SPACE_NAME%
git push --force space main
if errorlevel 1 ( echo [ERROR] HF Space push failed & exit /b 1 )
echo       Space: https://huggingface.co/spaces/%HF_USER%/%SPACE_NAME%

echo.
echo ============================================================
echo  DEPLOY COMPLETE
echo    GitHub : https://github.com/%GH_USER%/%REPO_NAME%
echo    HF     : https://huggingface.co/spaces/%HF_USER%/%SPACE_NAME%
echo ============================================================
endlocal