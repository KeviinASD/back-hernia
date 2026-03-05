## SISTEMA DE APOYO AL DIAGNÓSTICO DE HERNIA LUMBAR  
**DOCUMENTO TÉCNICO COMPLETO (FRONT + BACK + ML)**  

---

## 1. ANÁLISIS PROBLEMÁTICA DEL ENTORNO

### 1.1 Análisis externo

La hernia de disco lumbar (LDH) es una de las principales causas de dolor lumbar y afecta aproximadamente al 10 % de los pacientes con este síntoma, con un impacto importante en la calidad de vida y la productividad laboral. La literatura reciente (Lin et al., 2024; Zhang et al., 2023, 2024; Prisilla et al., 2023) muestra:

- **Carga epidemiológica y clínica**  
  - Alta prevalencia de LDH en población adulta.  
  - Importancia de la evaluación de severidad de la hernia para definir manejo conservador vs. quirúrgico.

- **Limitaciones del proceso diagnóstico actual**  
  - Interpretación manual de múltiples cortes de RM lumbar que consume varios segundos por imagen, lo que se multiplica por el número de cortes por paciente.  
  - Alta dependencia del juicio subjetivo del radiólogo, con discrepancias en la clasificación de discos abultados y hernias.

- **Impacto económico**  
  - Costos muy elevados asociados a estudios repetidos, tratamientos inadecuados y cirugías innecesarias (por ejemplo, en EE. UU. el costo anual de tratar LDH alcanza miles de millones de dólares).  
  - Acceso limitado a equipos de RM, lo que retrasa la detección y puede producir déficits neurológicos irreversibles.

En este contexto, los trabajos internacionales recientes proponen **modelos de machine learning y deep learning** para:

- Correlacionar características radiológicas (altura del disco, morfología) con presencia de abultamiento o hernia.  
- Automatizar la detección y clasificación de hernias lumbares a partir de RM.  
- Integrar sistemas de soporte a la decisión clínica que reduzcan tiempo de lectura, variabilidad diagnóstica y costos.

### 1.2 Análisis interno

En el contexto de práctica clínica real (hospitales públicos, clínicas privadas y centros especializados), se identifican los siguientes problemas:

1. **Interpretación manual tardía**  
   - El radiólogo debe revisar manualmente múltiples cortes sagitales y axiales de RM lumbar.  
   - El tiempo acumulado por caso es considerable, lo que retrasa la toma de decisiones y la priorización de pacientes.

2. **Variabilidad diagnóstica y ambigüedad en la severidad**  
   - La clasificación de severidad (por ejemplo, escalas tipo MSU 0–III) presenta discrepancias entre especialistas.  
   - Pacientes con imágenes “borderline” generan dudas sobre la indicación quirúrgica, lo que incrementa la variabilidad y el riesgo de decisiones subóptimas.

3. **Costos elevados por diagnósticos inconsistentes**  
   - Estudios repetidos de RM por dudas diagnósticas.  
   - Cirugías innecesarias o retraso en intervenciones que sí se requieren.  
   - Aumento de costos globales y riesgo de complicaciones para el paciente.

Ante ello, se propone un **Sistema Inteligente de Soporte a la Decisión Clínica** que:

- Automatice la detección y localización de hernias discales lumbares en RM.  
- Clasifique la severidad de la hernia para apoyar la decisión quirúrgica.  
- Integre un módulo de recomendación clínica que ayude a estandarizar el manejo.

---

## 2. COMPRENSIÓN DEL NEGOCIO

### 2.1 Objetivos del negocio

**Objetivos de negocio (necesidades):**

1. **Reducir el tiempo de interpretación diagnóstica** de resonancias magnéticas lumbares en pacientes con sospecha de LDH.  
2. **Localizar y clasificar la severidad de la hernia** de disco lumbar para apoyar decisiones quirúrgicas.  
3. **Reducir costos por diagnósticos erróneos y cirugías innecesarias**, optimizando el uso de recursos de imagen y tratamiento.

### 2.2 Objetivos de la solución

| Objetivo de negocio                                                                 | Solución técnica (modelo / sistema)                                                                                         | Tipo de analítica          |
|-------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|----------------------------|
| Reducir el tiempo de interpretación diagnóstica de RM lumbares                     | Desarrollar un modelo de detección de objetos que localice automáticamente discos y hernias en RM lumbares (YOLOv8 / SSD). | Predictivo (detección)     |
| Localizar y clasificar la severidad de la hernia para decisión quirúrgica          | Entrenar una red neuronal convolucional (detección + severidad) que clasifique el grado de hernia y genere scores de riesgo.| Predictivo (clasificación) |
| Reducir costos por diagnósticos erróneos y cirugías innecesarias                   | Integrar un sistema inteligente de soporte a la decisión clínica (LLM + reglas) que estandarice las recomendaciones.        | Prescriptivo               |

### 2.3 Variables a usar para cada objetivo de negocio

**Objetivo S‑1 – Reducir tiempo de interpretación (detección automática)**  

- **Variables de negocio**  
  - Tiempo de interpretación manual vs. tiempo de inferencia del modelo.  
  - Número de cortes analizados por caso.  
  - Estado de la cita (pendiente de informe, completada).

- **Variables de dataset / técnicas**  
  - `image_id`: identificador único de la imagen RM.  
  - `file_name`: nombre de archivo de la imagen (512×512 px, plano sagital).  
  - `bbox`: coordenadas \[x, y, width, height\] de discos y hernias.  
  - `area`: área del bounding box (tamaño de la lesión).  
  - `category_id`: clase del objeto (por ejemplo: 0 = disc, 1 = hdisc).

**Objetivo S‑2 – Clasificar severidad y apoyar decisión quirúrgica**

- **Variables de negocio**  
  - Severidad estimada de la hernia (score 0–100 o categorías clínicas).  
  - Necesidad de cirugía (sí/no, recomendada/no recomendada).  
  - Grupo clínico del paciente (por ejemplo, Grupo III con indicación poco clara).

- **Variables de dataset / técnicas**  
  - `category_id` y `category_name` refinidos para codificar grados de hernia.  
  - `confidence_score`: confianza de la predicción del modelo (0–1).  
  - Distribución de intensidades y morfología en la vecindad del disco afectado.

**Objetivo S‑3 – Reducir costos y estandarizar decisiones (soporte clínico)**

- **Variables de negocio**  
  - Edad del paciente.  
  - Comorbilidades: diabetes, artrosis, insuficiencia renal, malformaciones lumbosacras.  
  - Tipo de tratamiento recibido (conservador vs. quirúrgico) y evolución.

- **Variables de dataset / técnicas**  
  - Estructura clínica en historia médica (campos de texto estructurados y no estructurados).  
  - `texto_ia` y salida del LLM (recomendación terapéutica).  
  - Variables de seguimiento (EVA, funcionalidad, reincidencia).

---

## 3. COMPRESIÓN DE DATOS

### 3.1 Fuente de información del dataset

- **Fuente externa**  
  - Dataset de imágenes RM lumbares con anotaciones tipo COCO/YOLO para discos y hernias discales lumbares (p. ej. Roboflow u otro repositorio público con licencia CC BY 4.0).  
  - Estructura:  
    - Carpeta de imágenes RM (512×512 px, plano sagital).  
    - Archivo JSON/YOLO con anotaciones: `image_id`, `file_name`, `annotations[].bbox`, `annotations[].category_id`, `annotations[].area`, `categories[]`.

- **Fuentes internas (clínicas)**  
  - Historia clínica electrónica y registros del especialista (antecedentes, comorbilidades, escala EVA, decisiones terapéuticas).  
  - Información de contexto para el módulo prescriptivo (LLM).

### 3.2 Soluciones y algoritmos

| Solución ML/IA | Tipo de algoritmo | Enfoque principal          | Algoritmo 1         | Algoritmo 2          | Algoritmo 3        |
|----------------|-------------------|----------------------------|---------------------|----------------------|--------------------|
| S‑1            | Supervisado       | Velocidad (detección)      | YOLOv8n             | YOLOv8s              | SSD MobileNetV2    |
| S‑2            | Supervisado       | Precisión / severidad      | YOLOv8m             | YOLOv8l             | Faster R‑CNN       |
| S‑3            | Supervisado + LLM | Soporte a decisión clínica | YOLOv8 (mejor var.) | Faster R‑CNN        | LLM (Gemini/OpenAI)|

### 3.3 Soluciones y variables

Esta sección adapta la tabla de soluciones y variables al formato del informe de ejemplo.

| Solución Técnica (ML/IA/otro)                               | Variable de negocio                                                    | Variable DataSet / Técnica                                                                 | Observación                                                                                       |
|-------------------------------------------------------------|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Modelo de detección de objetos **YOLOv8 (Ultralytics)**     | Presencia de hernia lumbar en RM (Sí/No)                               | Clases del dataset: `0 = disc`, `1 = hdisc` (hernia discal)                               | Localiza y clasifica hernias en cortes de RM. Entrenado con anotaciones tipo YOLO.               |
| Modelo **Faster R-CNN ResNet50** (baseline comparativo)     | Exactitud del diagnóstico (apoyo a decisión del médico)                | Bounding boxes en formato `[xmin, ymin, xmax, ymax]`, etiquetas, scores                   | Implementado como modelo comparativo a YOLOv8.                                                    |
| Modelo **SSD MobileNetV2** (baseline liviano)               | Tiempo de inferencia / respuesta del sistema                           | Imágenes normalizadas a tamaño fijo (ej. 320×320) + anotaciones YOLO convertidas          | Evalúa trade‑off precisión vs. velocidad (uso en tiempo casi real).                              |
| Servicio de **Transcripción de audio a texto** (IA externa) | Registro estructurado del dictado médico                               | Archivo de audio (`audio/mpeg`, `audio/wav`, etc.), texto transcrito                       | Alimenta texto clínico adicional al módulo de diagnóstico IA.                                    |
| Módulo de **IA de lenguaje (Gemini/OpenAI)**                | Informe textual de diagnóstico y recomendaciones clínicas               | Prompt clínico (texto) + resultados del modelo de detección (clases, scores, bounding box)| Genera resumen legible para el médico y recomendación estandarizada.                             |
| Backend **NestJS (API REST)**                               | Gestión de pacientes, citas, diagnósticos y usuarios                   | Entidades: `Paciente`, `HistoriaClinica`, `Cita`, `ImagenRM`, `Diagnostico`, `User`, `Role`| Orquesta front, ML y base de datos.                                                               |
| Frontend **React/TypeScript**                               | Experiencia de usuario (médico/administrador)                          | Estados de interfaz, formularios, gráficos de evolución (EVA, severidad)                  | Consume API del backend y muestra resultados al usuario final.                                   |
| Servicio de **notificaciones (WhatsApp)**                   | Envío de resultados y recordatorios de cita a pacientes                | Payload JSON de mensaje (número, texto, plantillas)                                        | Configurado en módulo `notificaciones` del backend.                                              |

---

## 4. PREPARACIÓN DE DATOS Y APLICACIÓN

### 4.1 Calidad de data

Se evalúan las dimensiones clásicas de calidad (inspirado en el informe de ejemplo).

#### 4.1.1 Integridad de entidad

- Cada imagen RM se identifica por un `image_id` y un `file_name` únicos.  
- Cada anotación (bounding box) posee un identificador único y se asocia a una sola imagen.  
- No se encontraron registros duplicados exactos en el conjunto final.

#### 4.1.2 Integridad de dominio

Reglas de dominio principales:

- `bbox[0]` y `bbox[1]` (x, y) dentro del rango \[0, 512) en píxeles.  
- `bbox[2]` y `bbox[3]` (width, height) mayores a 0 y hasta 512.  
- `category_id` solo toma valores permitidos (ej. {0, 1} para disc / hdisc).  
- Todas las imágenes tienen resolución 512×512 px y modo de color compatible con RM.

Se detectaron casos donde `bbox` se almacena como `string`, lo que requiere conversión a `float` antes del entrenamiento.

#### 4.1.3 Evaluación de nulos

Se verifican campos críticos:

- `image_id`, `file_name`, `bbox`, `area`, `category_id`: sin valores nulos.  
- En las tablas clínicas (pacientes, historias, citas) se controlan campos obligatorios mediante validaciones de backend (DTOs y entidades en NestJS).

#### 4.1.4 Validaciones de negocio

- Ningún bounding box puede salir de los límites de la imagen (512×512 px).  
- Cada imagen debe contener un número clínicamente coherente de discos anotados (segmento lumbar L1–S1).  
- Las variables clínicas (edad, comorbilidades) se validan contra rangos razonables antes de ser usadas por el LLM.

### 4.2 Prototipos de aplicación

#### 4.2.1 Visión general (módulos principales)

- **Frontend (Médico/Administrador)**  
  - Login, Dashboard, Pacientes, Historia Clínica, Citas, Calendario, Diagnóstico IA, Usuarios, API Keys.

- **Backend (API REST)**  
  - Autenticación, gestión de usuarios, pacientes, historias clínicas, citas, imágenes, diagnósticos, notificaciones.

- **Servicio ML (Detección de hernia)**  
  - API de predicción sobre imágenes RM; carga de modelos YOLOv8 y Torchvision, inferencia y normalización de resultados.

#### 4.2.2 Product Backlog (funciones principales del software)

| Módulo                 | ID   | Función                                          | Descripción                                                                                                         |
|------------------------|------|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Autenticación          | F01  | Iniciar sesión                                   | Permitir acceso seguro al sistema a médicos y administradores mediante correo institucional y contraseña.          |
| Autenticación          | F02  | Login con Google                                | Autenticar usuarios usando OAuth2 con Google y generar token JWT.                                                  |
| Gestión de Usuarios    | F03  | Administrar usuarios                             | Crear, listar, editar y desactivar cuentas de usuario y asignarles un rol (Médico, Administrador).                 |
| Gestión de Pacientes   | F04  | Registrar paciente                               | Crear nuevos pacientes con datos personales, clínicos y de contacto.                                               |
| Gestión de Pacientes   | F05  | Buscar/Listar pacientes                          | Listar pacientes, filtrarlos por nombre/DNI y acceder a su historial.                                              |
| Historia Clínica       | F06  | Registrar historia clínica                       | Crear y actualizar antecedentes, diagnósticos previos y datos clínicos del paciente.                               |
| Gestión de Citas       | F07  | Programar cita                                   | Registrar nuevas citas médicas asociadas a un paciente y un médico.                                                |
| Gestión de Citas       | F08  | Actualizar/Cancelar cita                         | Reprogramar o cancelar citas existentes, controlando estados.                                                      |
| Gestión de Citas       | F09  | Ver calendario y estadísticas                    | Visualizar citas por día/semana/mes y estadísticas por estado.                                                     |
| Imágenes RM            | F10  | Subir imágenes de resonancia magnética           | Asociar imágenes RM a una cita para posterior análisis por el modelo de IA.                                        |
| Imágenes RM            | F11  | Visualizar imágenes                              | Obtener y visualizar imágenes RM almacenadas para una cita específica.                                             |
| Diagnóstico IA         | F12  | Ejecutar diagnóstico IA                          | Ejecutar el modelo de detección sobre las imágenes de la cita y obtener detecciones de hernia lumbar.             |
| Diagnóstico IA         | F13  | Generar informe de diagnóstico                   | Combinar resultados de detección + texto del médico para generar un informe estructurado con IA de lenguaje.      |
| Diagnóstico IA         | F14  | Aprobar/ajustar diagnóstico                      | Permitir que el médico valide o corrija el diagnóstico generado por IA.                                            |
| Analítica de Paciente  | F15  | Ver evolución (EVA y severidad)                  | Mostrar gráficos de tendencia del dolor (EVA) y severidad de hernia a lo largo del tiempo.                         |
| Notificaciones         | F16  | Enviar resultados por WhatsApp                   | Enviar al paciente un resumen de la cita y del diagnóstico a través de WhatsApp.                                   |
| Configuración / APIKey | F17  | Gestionar API Keys                               | Registrar y rotar claves de acceso a proveedores externos de IA y mensajería.                                      |

#### 4.2.3 Prototipo de funciones principales (ejemplos)

**FUNCIÓN F12 – Ejecutar diagnóstico IA**  

- **Descripción:** Permite seleccionar una cita con imágenes RM ya cargadas, escoger un modelo (YOLOv8n / YOLOv8s), ajustar parámetros de confianza/IOU y enviar la solicitud al servicio ML.  
- **Prototipo (vista Frontend – descripción):**  
  - Área izquierda: selector de paciente y lista de citas.  
  - Área central: tarjeta “Configurar análisis” (modelo, conf, IOU) + botón “Analizar imagen”.  
  - Área derecha: visor de imagen con bounding boxes y panel de resultados (nº de hernias, severidad estimada).

**FUNCIÓN F15 – Ver evolución de paciente (EVA y severidad)**  

- **Descripción:** Muestra la evolución temporal del dolor (EVA) y de la severidad de la hernia (score 0–100) en base a diagnósticos registrados.  
- **Prototipo:**  
  - Encabezado con datos del paciente.  
  - Dos gráficos de línea (EVA y severidad) con eje X = fecha de cita.  
  - Tabla cronológica de citas y valores asociados.

**FUNCIÓN F16 – Enviar resultados por WhatsApp**  

- **Descripción:** Desde el detalle de una cita completada permite enviar un resumen estructurado (fecha, médico, hallazgos, recomendaciones) vía WhatsApp, usando el módulo de notificaciones.  
- **Prototipo:**  
  - Botón “Enviar por WhatsApp” en el detalle de la cita.  
  - Diálogo de confirmación con número de contacto y texto del mensaje.  
  - Mensaje de éxito/error según respuesta del servicio externo.

*(El mismo formato se puede clonar para todas las funciones F01–F17.)*

### 4.3 Arquitectura de la aplicación

#### 4.3.1 Descripción general

Arquitectura en **tres capas principales**:

1. **Frontend Web (React/TypeScript)**  
   - Se comunica solo con el backend vía HTTP/HTTPS (API REST).  
   - Implementa pantallas de Login, Pacientes, Historia Clínica, Citas, Calendario, Diagnóstico IA, Usuarios, API Keys.

2. **Backend (NestJS / Node.js)**  
   - Expuesto como API REST.  
   - Módulos: `auth`, `users`, `pacientes`, `historia-clinica`, `citas`, `imagenes`, `diagnostico`, `notificaciones`, `integrations`.  
   - Se comunica con:  
     - Base de datos (p. ej. PostgreSQL).  
     - Servicio ML (`hernia-detection-python-`) para predicción.  
     - Servicios externos: IA de lenguaje y WhatsApp.

3. **Servicio ML (FastAPI/Python – YOLOv8 y Torchvision)**  
   - Endpoints tipo `/predict` que reciben imágenes o rutas, cargan modelos YOLOv8 / Faster R‑CNN / SSD y devuelven detecciones en JSON.  
   - Scripts principales en `hernia-detection-python-/main/main.py` y `main/routers/predict.py`.

4. **Base de datos**  
   - Esquema con tablas para `usuarios`, `roles`, `pacientes`, `historias_clinicas`, `citas`, `imagenes_rm`, `diagnosticos`, etc.

### 4.4 Modelo de datos (alto nivel)

Entidades principales:

- `User` (id, nombre, correo, contraseña hash, rol, estado).  
- `Role` (id, nombre, permisos).  
- `Paciente` (id, DNI, nombres, apellidos, fecha_nacimiento, sexo, ocupación, tabaquismo, contacto, activo).  
- `HistoriaClinica` (id, paciente_id, antecedentes, episodios_dolor, tratamientos, observaciones).  
- `Cita` (id UUID, paciente_id, medico_id, fecha_hora, motivo, estado, referencias a imágenes y diagnóstico).  
- `ImagenRM` (id UUID, cita_id, nombre_archivo, mimeType, datos/binario o ruta).  
- `Diagnostico` (id, cita_id, modelo_utilizado, severidad, num_hernias, texto_ia, comentarios_medico, aprobado).

---

## 5. MODELADO

### 5.1 Aplicación de algoritmos

| Problema de negocio                                               | Solución                                                                 | Algoritmo aplicado                                       | Script de librerías importadas                                                | Script de aplicación del algoritmo                                   |
|-------------------------------------------------------------------|--------------------------------------------------------------------------|----------------------------------------------------------|------------------------------------------------------------------------------|------------------------------------------------------------------------|
| Detectar hernias lumbares en imágenes de RM                       | Entrenar y usar un modelo de detección de objetos sobre RM lumbares     | YOLOv8 (n/s/m/l) – **Ultralytics**                       | `from ultralytics import YOLO` (en `train/train_models.py`, `main/model_loader.py`) | Función `train_yolov8(...)` y `model.train(...)` en `train/train_models.py` |
| Comparar rendimiento con otros modelos de detección               | Entrenar modelos de Torchvision con mismo dataset                        | Faster R‑CNN ResNet50; SSD MobileNetV2                   | `from torchvision.models.detection import fasterrcnn_resnet50_fpn` etc.     | Función `train_torch_detection(...)` en `train/train_models.py`       |
| Ejecutar inferencia en producción sobre imágenes subidas por cita | Cargar modelo entrenado y predecir bounding boxes + clases + scores     | YOLOv8 (inferencia)                                      | `from ultralytics import YOLO`                                              | Carga de modelos en `main/model_loader.py` y uso en `main/inference.py`   |

> En el documento final se pueden copiar fragmentos concretos de código de `train/train_models.py` y `main/model_loader.py` para ilustrar esta sección.

### 5.2 Aplicación de métricas

| Problema de negocio                                      | Solución                                                       | Algoritmo aplicado             | Script de métricas                                                  | Resultados de métricas aplicadas*                         |
|----------------------------------------------------------|----------------------------------------------------------------|--------------------------------|---------------------------------------------------------------------|-----------------------------------------------------------|
| Evaluar qué modelo detecta mejor las hernias             | Calcular mAP, precisión y recall sobre conjunto de validación | YOLOv8 / Faster R‑CNN / SSD    | Uso de `torchmetrics` y métricas de Ultralytics en `train_models.py` | (Completar con valores concretos: mAP, precisión, recall) |
| Seleccionar variante YOLOv8 (n/s/m/l) más adecuada       | Comparar mAP y tiempo de inferencia por variante              | YOLOv8n vs YOLOv8s vs YOLOv8m  | Logs de entrenamiento y validación en `train_log.jsonl`            | (Completar tabla por variante)                            |

\* Aquí se deben colocar los números concretos obtenidos (mAP@0.5, mAP@0.5:0.95, precisión, recall, etc.).

---

## 6. EVALUACIÓN

### 6.1 Evaluación de métricas (modelo)

| Problema de negocio                                           | Solución                                                      | Algoritmo aplicado     | Script de métricas                          | Resultados de métricas aplicadas                        |
|---------------------------------------------------------------|---------------------------------------------------------------|------------------------|---------------------------------------------|----------------------------------------------------------|
| Reducir errores de diagnóstico (falsos negativos de hernia)   | Elegir modelo con mayor recall manteniendo buena precisión   | YOLOv8 (mejor variante) | `train/train_models.py` (cálculo de mAP y recall) | (Interpretación: p. ej. “recall 0.92, reduce falsos negativos…”) |
| Lograr tiempos de respuesta adecuados en consulta             | Evaluar tiempo de inferencia por imagen/cita                 | YOLOv8n / SSD          | Scripts de medición de tiempo en pruebas     | (Ej.: “tiempo medio 0.2 s/imagen con YOLOv8n en GPU…”)    |

### 6.2 Evaluación del software

| Problema de negocio                                            | Solución                                                             | Algoritmo aplicado              | Captura de resultados enviados en PDF             | Captura de envío de resultados a WhatsApp           |
|----------------------------------------------------------------|----------------------------------------------------------------------|---------------------------------|---------------------------------------------------|-----------------------------------------------------|
| Entregar informes claros y exportables a los pacientes/médicos | Generar PDF con resultado del diagnóstico e incluirlo en la historia | YOLOv8 + IA de lenguaje         | (Pegar captura de descarga/visualización del PDF) | (Pegar captura del mensaje PDF enviado por WhatsApp)|
| Notificar oportunamente al paciente                            | Enviar resumen de la cita y del diagnóstico por WhatsApp             | Lógica de negocio en backend    | (ID de anexo con capturas)                       | (ID de anexo con capturas de WhatsApp)             |

---

## 7. DESPLIEGUE

### 7.1 Tabla general de despliegue

| Componente              | Plataforma             | Configuración                                                                 | Anexo                |
|-------------------------|------------------------|-------------------------------------------------------------------------------|----------------------|
| Aplicación Frontend     | Web (React/TypeScript) | Deploy en servidor web / contenedor; configuración de `VITE_API_URL` o similar | Ver Anexo (capturas) |
| Backend API             | Node.js (NestJS)       | `npm run start:prod` / contenedor Docker; `.env` con URL BD, claves JWT, etc. | Ver Anexo (scripts)  |
| Servicio ML             | Python + FastAPI       | Uvicorn/Gunicorn, `requirements.txt`, descarga previa de modelos YOLO         | Ver Anexo (Dockerfile) |
| Base de datos           | PostgreSQL (u otro)    | Script de creación de esquema/tablas, variables de conexión en backend        | Ver Anexo (scripts SQL) |
| Notificaciones WhatsApp | Servicio externo API   | Token/API Key configurada en backend (`NOTIF_WHATSAPP_TOKEN`, etc.)           | Ver Anexo (config)   |

### 7.2 Ejemplo en formato solicitado

| Componente              | Plataforma                    | Configuración                                       | Anexo          |
|-------------------------|-------------------------------|-----------------------------------------------------|----------------|
| Aplicación funcionamiento | Web (Médico/Admin)          | Build frontend + backend en servidor de producción  | Ver Anexo XXX  |
| Aplicación fuente       | Front: React/TS; Back: NestJS | Repos `front-hernia`, `back-hernia` con `package.json` | Ver Anexo XXS  |
| Base de datos           | PostgreSQL                    | Script de creación de tablas y usuario              | Ver Anexo XYS  |
| Otros componentes       | Editor de programación        | VSCode/Cursor como IDE principal                    | (Opcional)     |
| Código fuente           |                               | Link a repos Git (backend, frontend, ML)            | Ver Anexo (URL)|

---

## 8. REFERENCIAS BIBLIOGRÁFICAS

Ejemplos de referencias utilizadas en el contexto clínico de LDH (adaptadas del documento de contexto):

- Lin, P.-C., Chang, W.-S., Hsiao, K.-Y., Liu, H.-M., Shia, B.-C., Chen, M.-C., Hsieh, P.-Y., Lai, T.-W., Lin, F.-H., & Chang, C.-C. (2024). Development of a Machine Learning Algorithm to Correlate Lumbar Disc Height on X-rays with Disc Bulging or Herniation. *Diagnostics*, 14(2), 134.  
- Prisilla, A. A., et al. (2023). An approach to the diagnosis of lumbar disc herniation using deep learning models. *Frontiers in Bioengineering and Biotechnology*, 11, 1247112.  
- Zhang, D., et al. (2024). A fully automatic MRI‑guided decision support system for lumbar disc herniation using machine learning. *JOR SPINE*, 7(2), e1342.  
- Zhang, W., et al. (2023). Deep learning‑based detection and classification of lumbar disc herniation on magnetic resonance images. *JOR SPINE*, 6(3), e1276.  
- Duceac Covrig, M., et al. (2025). A retrospective study of lumbar disk herniation: An analysis of clinical cases and treatment plans. *Journal of Clinical Medicine*, 14(11), 3952.

*(Se pueden completar y normalizar las referencias según el formato bibliográfico exigido por la universidad.)*

---

## 9. ANEXOS

- **Anexo 1:** Cuadro general del curso / ficha de proyecto.  
- **Anexo 2:** Detalle de modelos LM / prompts utilizados.  
- **Anexo 3:** Información del especialista clínico consultado.  
- **Anexo 4:** Tablas de validación de variables y match con el especialista.  
- **Anexo 5:** Capturas de pantalla del sistema web (frontend, backend, servicio ML).  
- **Anexo 6:** Tablas completas de métricas por modelo y variante.

Este documento sigue la estructura del **Informe Final Analítica – Detección temprana de enfermedades de plantas**, adaptando el **contexto de hernia lumbar**, las variables de negocio y las soluciones técnicas al sistema de apoyo al diagnóstico desarrollado (frontend, backend y servicio ML).


