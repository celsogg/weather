# weather

## Requisitos
  - Redis corriendo en la máquina de ejecución en el puerto por defecto (127.0.0.1:6379)
  - Node JS (probado con node 12)

## Instalación
  - Clonar o descargar y extraer el proyecto
  - Dentro de la carpeta del proyecto ejecutar ```npm i``` para instalar las dependencias, hacer lo mismo dentro de la carpeta weather-front
  - Dentro de la carpeta del proyecto ejecutar ```npm run start```
  - La aplicación iniciará y se podrá ver el front en ```http://localhost:3000```

## Consideraciones
  - Las IPs, puertos, api keys, etc se encuentran, por simplicidad, en duro dentro del código
  - Buscando en internet se determinó que Georgia es un estado, no una ciudad, por lo tanto se muestra Atlanta como ciudad (capital de Georgia)
  - Las latitudes y longitudes se buscaron en https://latitudelongitude.org/cl/santiago/
  - Al iniciar la ejecución se obtiene la temperatura de cada ciudad, y luego cada 10 segundos se obtiene la temperatura de una ciudad a la vez como recorriendo un arreglo circular
  - Forecast.io redirecciona a https://darksky.net/
