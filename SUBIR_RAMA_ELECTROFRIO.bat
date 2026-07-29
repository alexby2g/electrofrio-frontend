@echo off
chcp 65001 >nul
title Subir Electro Frio Web V10 a GitHub

cd /d "%~dp0electrofrio_web_publish"

echo ==============================================
echo   ELECTRO FRIO WEB V10 - SUBIR RAMA A GITHUB
echo ==============================================
echo.
echo Rama preparada: electrofrio-web-v10
echo Actualizacion preparada: Corrige pantalla blanca del inicio de sesion
echo.

git status -sb
echo.
git push -u origin electrofrio-web-v10

if errorlevel 1 (
  echo.
  echo No se pudo subir automaticamente.
  echo Inicia sesion en GitHub cuando Windows o Git Credential Manager lo solicite
  echo y vuelve a ejecutar este archivo.
) else (
  echo.
  echo LISTO: la rama electrofrio-web-v10 fue subida correctamente.
  echo Repositorio: https://github.com/alexby2g/electro-frio-frontend
)

echo.
pause
