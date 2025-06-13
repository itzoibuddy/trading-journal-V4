@echo off
echo This script will help you push your code to GitHub

REM Check if Git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Git is not installed or not in your PATH.
  echo Please install Git from https://git-scm.com/downloads
  pause
  exit /b 1
)

REM Check if the repository is initialized
if not exist .git (
  echo Initializing Git repository...
  git init
  git add .
  git commit -m "Initial commit"
) else (
  echo Git repository already initialized.
)

REM Set remote if not already set
git remote -v | findstr "origin" >nul
if %ERRORLEVEL% NEQ 0 (
  echo Please enter your GitHub repository URL:
  set /p repo_url=
  git remote add origin %repo_url%
) else (
  echo Remote origin already set.
)

REM Push to GitHub
echo Pushing to GitHub...
git add .
git commit -m "Update for Vercel deployment"
git push -u origin main

echo Done! Your code has been pushed to GitHub.
pause 