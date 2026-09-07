# SICAF - Aplicación móvil del DRAT

Aplicación móvil para el personal de seguridad del DRAT. Forma parte de SICAF y permitirá registrar ingresos y salidas de funcionarios, vehículos, visitantes y proveedores.

El proyecto está construido con React Native, Expo y TypeScript. Durante la preparación técnica, NFC, OCR, consulta de identidad y sincronización permanecen simulados.

## Estado actual

- Proyecto móvil base creado.
- Pantalla inicial del guarda disponible.
- Ejecución verificada en Expo Go y web.
- Rama de desarrollo: `dev`.
- Repositorio: <https://github.com/maikol8-10/DRAT-REGISTRO-APP>

## Herramientas verificadas

| Herramienta | Versión verificada |
| --- | --- |
| Node.js | 24.20.0 |
| npm | 11.19.0 |
| npx | 11.19.0 |
| Git | 2.53.0.windows.3 |
| Visual Studio Code | 1.136.0 |
| Expo CLI | 57.0.21 |
| Expo SDK | 57 |
| React Native | 0.86.3 |
| React | 19.2.3 |
| TypeScript | 6.0.3 |

Expo SDK 57 requiere Node.js 22.13 o superior. La versión instalada cumple este requisito.

## Requisitos

- Windows 10 u 11.
- Node.js 22.13 o superior.
- Git.
- Visual Studio Code.
- Expo Go actualizado en un teléfono Android.
- Computadora y teléfono con acceso a Internet.

Android Studio no es obligatorio para esta etapa. La aplicación puede probarse con Expo Go en un teléfono físico o desde un navegador.

## Pruebas en Android verificadas

La configuración de pruebas fue validada con:

- Android Studio instalado.
- Android SDK Platform 36 y Build Tools 36.0.0.
- Android SDK Command-line Tools y Platform-Tools.
- Aceleración de virtualización WHPX.
- Emulador `SICAF_API_36` con Android 16.
- ADB 1.0.41.
- Expo Go instalado en el emulador.
- Aplicación compilada y abierta correctamente en el emulador.
- Aplicación abierta correctamente con Expo Go en un teléfono físico.

Antes de ejecutar comandos Android desde una terminal nueva de PowerShell, puede definir temporalmente el SDK:

```powershell
$env:ANDROID_HOME="C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:Path="$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
```

Para comprobar los dispositivos disponibles:

```powershell
adb.exe devices -l
```

Con `SICAF_API_36` iniciado, abra la aplicación en el emulador mediante:

```powershell
npx.cmd expo start --android
```

La primera ejecución descarga e instala Expo Go y reconstruye la caché de Metro, por lo que puede tardar varios minutos.

## Instalación

Abra PowerShell o la terminal integrada de VS Code y entre en la carpeta del proyecto:

```powershell
cd DRAT-REGISTRO-APP
```

Instale las dependencias:

```powershell
npm.cmd install
```

En algunos equipos Windows, PowerShell bloquea `npm.ps1`. Por esta razón, los ejemplos utilizan `npm.cmd` y `npx.cmd`; no es necesario modificar la política de ejecución del sistema.

## Ejecutar con Expo Go

Inicie el servidor de desarrollo:

```powershell
npx.cmd expo start
```

Después:

1. Mantenga abierta la terminal.
2. Abra Expo Go en el teléfono.
3. Escanee el código QR generado.
4. Espere a que Metro termine la primera compilación.

Para detener el servidor, presione `Ctrl + C`.

## Ejecutar mediante túnel

Si una VPN, el firewall o la red impiden la conexión local, use un túnel:

```powershell
npx.cmd expo start --tunnel --clear
```

El proyecto incluye `@expo/ngrok`, necesario para este modo. Si `npx.cmd` no localiza correctamente Expo, utilice el ejecutable instalado en el proyecto:

```powershell
.\node_modules\.bin\expo.cmd start --tunnel --clear
```

## Ejecutar en el navegador

```powershell
npx.cmd expo start --web
```

También puede iniciar Expo normalmente y presionar `w` en la terminal.

## Validaciones

Comprobar estilo y errores estáticos:

```powershell
npm.cmd run lint
```

Generar una compilación web estática:

```powershell
.\node_modules\.bin\expo.cmd export --platform web
```

Comprobar las dependencias principales:

```powershell
npm.cmd ls --depth=0
```

## Flujo de trabajo con Git

El desarrollo se realiza en la rama `dev`:

```powershell
git switch dev
git pull origin dev
```

La rama `main` se reserva para versiones estables. Los cambios deben probarse antes de integrarlos en `main`.

## Solución de problemas

### PowerShell bloquea `npm.ps1`

Utilice:

```powershell
npm.cmd --version
npx.cmd expo start
```

### Expo Go muestra “Something went wrong”

1. Detenga Expo con `Ctrl + C`.
2. Cierre completamente Expo Go.
3. Actualice Expo Go desde Play Store.
4. Reinicie limpiando la caché:

```powershell
.\node_modules\.bin\expo.cmd start --tunnel --clear
```

5. Escanee únicamente el nuevo código QR.
6. Si vuelve a fallar, revise `View error log` y la salida de la terminal.

### La comprobación de Expo falla con errores de red

`expo install --check` necesita acceso a Internet. Una VPN o política de red puede impedir esta comprobación aunque el proyecto compile correctamente. Pruebe nuevamente con una conexión que permita acceso a los servicios de Expo.

## Estructura principal

```text
src/app/          Pantallas y rutas de Expo Router
src/components/   Componentes reutilizables
src/constants/    Tema y constantes visuales
src/hooks/        Hooks de la aplicación
assets/           Imágenes e iconos
android/          Proyecto Android generado
```

## Criterios cumplidos de configuración

- Versiones de las herramientas identificadas y documentadas.
- Dependencias instaladas.
- Aplicación ejecutada mediante Expo Go.
- Compilación web verificada.
- Comando de lint verificado.
- Procedimiento reproducible documentado.
- Alternativa sin Android Studio documentada.
- Problemas conocidos de PowerShell, VPN y Expo registrados.

## Base de la aplicación móvil

La base funcional de SICAF utiliza React Native, Expo, TypeScript y Expo Router. La pantalla principal presenta los procesos previstos para la garita y cada acción navega a una pantalla provisional identificada por tipo de proceso.

Las pantallas provisionales permiten comprobar el flujo de navegación sin adelantar las integraciones de NFC, OCR, visitantes o funcionamiento sin conexión, que pertenecen a entregables posteriores.

### Rutas iniciales

```text
/                         Pantalla principal de SICAF
/registro/[tipo]          Pantalla provisional del proceso seleccionado
```

### Evidencia de validación

El 7 de septiembre de 2026 se verificó la base móvil con los siguientes resultados:

- ESLint: completado sin errores mediante `npm.cmd run lint`.
- TypeScript estricto: completado sin errores mediante `npx.cmd tsc --noEmit`.
- Compilación Android: paquete generado correctamente mediante `npx.cmd expo export --platform android`.
- Navegación: las rutas y acciones de NFC, OCR, visitante y emergencia fueron verificadas por TypeScript y por la compilación Android; queda como comprobación visual abrirlas en el emulador.
- Ejecución local: proyecto comprobado previamente en el emulador Android `SICAF_API_36`.

### Criterios cumplidos de la base móvil

- El proyecto utiliza React Native, Expo y TypeScript.
- Incluye navegación con Expo Router y una pantalla inicial funcional.
- Ejecuta y compila localmente sin errores bloqueantes.
- La implementación y sus comandos de validación están documentados.
