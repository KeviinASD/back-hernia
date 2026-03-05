## SISTEMA DE APOYO AL DIAGNÓSTICO DE HERNIA LUMBAR
**MANUAL DE CÓDIGO – BACKEND**

---

## ÍNDICE GENERAL

**Contenido**

**A) MÓDULO DE AUTENTICACIÓN Y SEGURIDAD (`auth`)**  
- Endpoints de login y registro  
- Autenticación con Google  
- Obtención de datos del usuario autenticado

**B) MÓDULO DE USUARIOS Y ROLES (`users`)**  
- Gestión de usuarios  
- Gestión de roles y permisos básicos

**C) MÓDULO DE PACIENTES (`pacientes`)**  
- Registro y actualización de pacientes  
- Búsqueda por DNI  
- Desactivación (soft delete)

**D) MÓDULO DE HISTORIA CLÍNICA (`historia-clinica`)**  
- Creación de historia clínica  
- Consulta y actualización de historia clínica

**E) MÓDULO DE CITAS (`citas`)**  
- Programación de citas  
- Listado y filtrado de citas  
- Cambio de estado de citas (Programada, En Curso, Completada, Cancelada)  
- Estadísticas por estado y por doctor

**F) MÓDULO DE IMÁGENES RM (`imagenes`)**  
- Carga de imágenes de RM asociadas a una cita  
- Listado de imágenes almacenadas  
- Visualización de la imagen binaria

**G) MÓDULO DE DIAGNÓSTICO IA (`diagnostico`)**  
- Inicio del diagnóstico IA por cita  
- Modos de operación (producción / pruebas)  
- Aprobación del diagnóstico por el médico  
- Obtención del diagnóstico y datos de tendencia

**H) MÓDULOS DE INTEGRACIÓN**  
- Integración de detección de hernia (modelos YOLO u otros)  
- Integración de IA de lenguaje (Gemini / OpenAI)  
- Integración de transcripción de audio

**I) MÓDULO DE NOTIFICACIONES**  
- Envío de notificaciones externas (por ejemplo, WhatsApp)

**J) CONFIGURACIÓN, SEEDING Y UTILIDADES COMUNES**  
- Configuración de entorno y base de datos  
- Módulo de seeding de datos  
- Enumerados y DTOs compartidos

---

## A) MÓDULO DE AUTENTICACIÓN Y SEGURIDAD (`auth`)

### Descripción general

El módulo `auth` centraliza la autenticación de usuarios y la emisión de tokens JWT que son consumidos por el frontend. Expone endpoints REST bajo el prefijo `/auth` y se integra con estrategias de seguridad (JWT y Google OAuth).

### Endpoints principales

- **POST `/auth/login`**
  - **Descripción:** se muestra el código para el endpoint de inicio de sesión.  
    Recibe un cuerpo de tipo `SignInDto` con correo y contraseña. El servicio `AuthService.login` valida las credenciales, genera el token JWT y retorna la información básica del usuario autenticado.

- **POST `/auth/register`**
  - **Descripción:** se muestra el código para el endpoint de registro.  
    Recibe un `SignUpDto` con los datos del nuevo usuario, crea el registro en la entidad `User` y devuelve la información del usuario creado (normalmente asociándolo a un rol por defecto).

- **GET `/auth/me`**
  - **Descripción:** se muestra el código que devuelve los datos del usuario activo.  
    Utiliza el decorador `@ActiveUser()` para extraer el `JwtPayloadParams` del contexto de la petición y devolver el ID, correo y rol del usuario autenticado.

- **GET `/auth/google/login`**
  - **Descripción:** se muestra el código para iniciar el flujo de autenticación con Google.  
    El endpoint está protegido por el guard `GoogleAuthGuard`, que redirige al proveedor externo para que el usuario otorgue permisos.

- **GET `/auth/google/callback`**
  - **Descripción:** se muestra el código que maneja el callback de Google OAuth.  
    Recupera el usuario autenticado desde `req.user` (poblado por la estrategia de Google), llama a `AuthService.loginFromGoogle` para generar el token y finalmente redirige al frontend (`/auth/success`) para completar el flujo.

- **GET `/auth/success`**
  - **Descripción:** se muestra el código de confirmación de autenticación Google.  
    Retorna un mensaje simple que indica que la autenticación con Google fue exitosa.

#### Código del controlador `AuthController`

```ts
@Controller('auth')
export class AuthController {
  
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiBody({ type: SignInDto, description: 'User login credentials', })
  @ApiResponse({ status: 200, description: 'Login successful' })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.login(signInDto);
  }

  @Public()
  @Post('register')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.register(signUpDto);
  }

  @Get('me')
  me(@ActiveUser() user: JwtPayloadParams) {
    return user;
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res: Response) {
    const user: User = req.user;
    const result: resultAndTokenParams = await this.authService.loginFromGoogle(user);
    console.log({ result });
    res.redirect("http://localhost:3030/auth/success");
  }

  @Public()
  @Get('success')
  googleSuccess() {
    return { message: 'Google authentication successful. You can now access your account.' };
  }
}
```

---

## B) MÓDULO DE USUARIOS Y ROLES (`users`)

### Descripción general

El módulo `users` agrupa la lógica de gestión de cuentas de usuario, incluyendo la entidad `User`, la entidad `Role` y los servicios asociados. Sus controladores expondrán endpoints bajo el prefijo `/users` y `/roles` para administración de cuentas desde el frontend.

### Funcionalidad principal

- **Gestión de usuarios (`UsersController`, `UsersService`)**
  - **Descripción:** se muestra el código responsable de crear, listar, actualizar y desactivar usuarios del sistema.  
    Los DTOs `CreateUserDto` y `UpdateUserDto` definen qué campos pueden modificarse (nombre, correo institucional, contraseña, rol, estado).

- **Gestión de roles (`RoleController`, `RoleService`)**
  - **Descripción:** se muestra el código para administrar los roles (por ejemplo, Médico, Administrador).  
    El DTO `RoleCreateDto` se utiliza para crear o actualizar roles, asociando permisos básicos a cada uno.

- **Integración con seguridad**
  - **Descripción:** se utiliza el enum `Role` definido en `common/enums/role.enum.ts` junto con el decorador `@Roles(...)` y el guard de roles para restringir endpoints según el rol autenticado.

---

## C) MÓDULO DE PACIENTES (`pacientes`)

### Descripción general

El módulo `pacientes` gestiona el ciclo de vida de los pacientes registrados en el sistema. Expone endpoints REST bajo el prefijo `/pacientes` y trabaja con la entidad `Paciente` y sus DTOs de creación y actualización.

### Endpoints principales

- **POST `/pacientes`**
  - **Descripción:** se muestra el código para crear un nuevo paciente.  
    El endpoint recibe un `CreatePacienteDto` con datos personales, clínicos y de contacto, y delega en `PacientesService.create` la lógica de validación y persistencia.

- **GET `/pacientes`**
  - **Descripción:** se muestra el código para listar todos los pacientes activos.  
    El servicio `PacientesService.findAll` aplica filtros internos para devolver solo pacientes con estado activo, de forma alineada con la pantalla de listado del frontend.

- **GET `/pacientes/dni/:dni`**
  - **Descripción:** se muestra el código que permite buscar un paciente por su DNI.  
    El endpoint delega en `PacientesService.findByDni`, que consulta la base de datos y retorna el paciente correspondiente o un error si no existe.

- **GET `/pacientes/:id`**
  - **Descripción:** se muestra el código que recupera un paciente por su identificador numérico.  
    Utiliza `ParseIntPipe` para validar el parámetro y llama a `PacientesService.findOne`.

- **PUT `/pacientes/:id`**
  - **Descripción:** se muestra el código para actualizar los datos del paciente.  
    Recibe un `UpdatePacienteDto` y ejecuta `PacientesService.update`, permitiendo modificar datos personales, ocupación, IMC y otros campos relevantes.

- **DELETE `/pacientes/:id`**
  - **Descripción:** se muestra el código para realizar un soft delete sobre el paciente.  
    No elimina físicamente el registro, sino que marca al paciente como inactivo para que ya no aparezca en los listados principales.

#### Código del controlador `PacientesController`

```ts
@ApiTags('Pacientes')
@ApiBearerAuth()
@Controller('pacientes')
export class PacientesController {

  constructor(private readonly pacientesService: PacientesService) { }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo paciente' })
  create(@Body() dto: CreatePacienteDto) {
    return this.pacientesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los pacientes activos' })
  findAll() {
    return this.pacientesService.findAll();
  }

  @Get('dni/:dni')
  @ApiOperation({ summary: 'Buscar paciente por DNI' })
  findByDni(@Param('dni') dni: string) {
    return this.pacientesService.findByDni(dni);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos del paciente' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePacienteDto,
  ) {
    return this.pacientesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar paciente (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.remove(id);
  }
}
```

---

## D) MÓDULO DE HISTORIA CLÍNICA (`historia-clinica`)

### Descripción general

El módulo `historia-clinica` asocia información clínica detallada a cada paciente (antecedentes, episodios de dolor lumbar, estudios de imagen, tratamientos, etc.). Sus endpoints se anidan bajo el prefijo `/pacientes/:pacienteId/historia-clinica`.

### Endpoints principales

- **POST `/pacientes/:pacienteId/historia-clinica`**
  - **Descripción:** se muestra el código para crear la historia clínica inicial de un paciente.  
    El endpoint recibe un `CreateHistoriaClinicaDto`, valida el `pacienteId` con `ParseIntPipe` y llama a `HistoriaClinicaService.create` para guardar los antecedentes y datos clínicos iniciales.

- **GET `/pacientes/:pacienteId/historia-clinica`**
  - **Descripción:** se muestra el código que recupera la historia clínica de un paciente.  
    `HistoriaClinicaService.findByPaciente` devuelve todos los datos clínicos estructurados para ser consumidos por la pantalla de Historia Clínica en el frontend.

- **PUT `/pacientes/:pacienteId/historia-clinica`**
  - **Descripción:** se muestra el código usado para actualizar la historia clínica.  
    Recibe un `UpdateHistoriaClinicaDto` y delega en `HistoriaClinicaService.update` la lógica de modificación de campos clínicos.

#### Código del controlador `HistoriaClinicaController`

```ts
@ApiTags('Historia Clínica')
@ApiBearerAuth()
@Controller('pacientes/:pacienteId/historia-clinica')
export class HistoriaClinicaController {

  constructor(private readonly hcService: HistoriaClinicaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear historia clínica del paciente' })
  create(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Body() dto: CreateHistoriaClinicaDto,
  ) {
    return this.hcService.create(pacienteId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener historia clínica del paciente' })
  findOne(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.hcService.findByPaciente(pacienteId);
  }

  @Put()
  @ApiOperation({ summary: 'Actualizar historia clínica' })
  update(
    @Param('pacienteId', ParseIntPipe) pacienteId: number,
    @Body() dto: UpdateHistoriaClinicaDto,
  ) {
    return this.hcService.update(pacienteId, dto);
  }
}
```

---

## E) MÓDULO DE CITAS (`citas`)

### Descripción general

El módulo `citas` coordina la programación y gestión de las consultas médicas. Maneja la entidad `Cita` y el enum de estados, y proporciona endpoints que soportan las pantallas de Calendario, Citas y estadísticas del sistema.

### Endpoints principales

- **POST `/citas`**
  - **Descripción:** se muestra el código para programar una nueva cita.  
    Recibe un `CreateCitaDto` con fecha, hora, motivo y paciente; el controlador pasa además el `id` del doctor autenticado (`req.user.id`) a `CitasService.create`, que valida que la fecha no esté en el pasado y que no haya conflicto de horario con otras citas del mismo médico.

- **GET `/citas`**
  - **Descripción:** se muestra el código que lista las citas con filtros opcionales.  
    El endpoint recibe un `FilterCitaDto` vía query string (por estado, rango de fechas, paciente, etc.) y delega el filtrado en `CitasService.findAll`.

- **GET `/citas/hoy`**
  - **Descripción:** se muestra el código que obtiene las citas del día para el doctor autenticado.  
    Llama a `CitasService.findCitasHoy(req.user.id)` y se utiliza para poblar rápidamente el panel del médico en el frontend.

- **GET `/citas/stats`**
  - **Descripción:** se muestra el código para obtener estadísticas de citas por estado.  
    Si el usuario autenticado es administrador, puede especificar `doctorId` en la query para consultar a otro médico; en caso contrario, el servicio calcula las estadísticas solo para el doctor actual.

- **GET `/citas/paciente/:pacienteId`**
  - **Descripción:** se muestra el código que devuelve el historial de citas de un paciente.  
    `CitasService.findByPaciente` se utiliza para alimentar las gráficas de evolución y el listado cronológico de citas en la ficha del paciente.

- **GET `/citas/:id`**
  - **Descripción:** se muestra el código para obtener el detalle completo de una cita.  
    El identificador es un UUID validado con `ParseUUIDPipe`, y `CitasService.findOne` retorna los datos de la cita junto con sus imágenes y diagnóstico asociado.

- **PATCH `/citas/:id`**
  - **Descripción:** se muestra el código para actualizar datos de una cita ya programada.  
    Recibe un `UpdateCitaDto` (fecha, motivo, doctor) y se usa principalmente para reprogramaciones.

- **PATCH `/citas/:id/iniciar`**
  - **Descripción:** se muestra el código que marca una cita como `EN_CURSO`.  
    `CitasService.iniciar` cambia el estado de la cita y registra la transición.

- **PATCH `/citas/:id/completar`**
  - **Descripción:** se muestra el código que completa una cita.  
    `CitasService.completar` requiere que exista un diagnóstico asociado antes de permitir el cambio de estado a `COMPLETADA`.

- **PATCH `/citas/:id/cancelar`**
  - **Descripción:** se muestra el código que cancela una cita programada.  
    `CitasService.cancelar` actualiza el estado a `CANCELADA` y puede almacenar el motivo de cancelación según la implementación.

#### Código del controlador `CitasController`

```ts
@ApiTags('Citas')
@ApiBearerAuth()
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) { }

  @Post()
  @ApiOperation({ summary: 'Programar una nueva cita' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Fecha inválida o en el pasado.' })
  @ApiResponse({ status: 409, description: 'Conflicto de horario con otra cita.' })
  create(@Body() dto: CreateCitaDto, @Request() req) {
    return this.citasService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar citas con filtros opcionales' })
  findAll(@Query() filters: FilterCitaDto) {
    return this.citasService.findAll(filters);
  }

  @Get('hoy')
  @ApiOperation({ summary: 'Obtener citas del día para el doctor autenticado' })
  findHoy(@Request() req) {
    return this.citasService.findCitasHoy(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de citas por estado' })
  getStats(@Request() req, @Query('doctorId') doctorId?: string) {
    const targetId = req.user.rol === 'admin' ? doctorId : req.user.id;
    return this.citasService.getStats(targetId);
  }

  @Get('paciente/:pacienteId')
  @ApiOperation({ summary: 'Historial de citas de un paciente' })
  @ApiParam({ name: 'pacienteId', type: 'number' })
  findByPaciente(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.citasService.findByPaciente(pacienteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle completo de una cita (incluye imágenes y diagnóstico)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.citasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de una cita (fecha, motivo, doctor)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCitaDto,
    @Request() req,
  ) {
    return this.citasService.update(id, dto, req.user.id);
  }

  @Patch(':id/iniciar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar cita como EN_CURSO' })
  iniciar(@Param('id', ParseUUIDPipe) id: string) {
    return this.citasService.iniciar(id);
  }

  @Patch(':id/completar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar cita (requiere diagnóstico previo)' })
  completar(@Param('id', ParseUUIDPipe) id: string) {
    return this.citasService.completar(id);
  }

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una cita programada' })
  cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return this.citasService.cancelar(id);
  }
}
```

---

## F) MÓDULO DE IMÁGENES RM (`imagenes`)

### Descripción general

El módulo `imagenes` se encarga de almacenar y servir las imágenes de resonancia magnética (RM) asociadas a cada cita. Sus endpoints se anidan bajo `/citas/:citaId/imagenes` y se integran con el módulo de diagnóstico IA.

### Endpoints principales

- **POST `/citas/:citaId/imagenes`**
  - **Descripción:** se muestra el código para subir imágenes de RM.  
    Utiliza `FilesInterceptor` con el campo `imagenes`, permitiendo hasta 10 archivos por solicitud y limitando el tipo MIME a `image/jpeg`, `image/png` y `image/webp`.  
    El servicio `ImagenesService.guardarImagenes` almacena los metadatos y el buffer binario de cada imagen asociándolos a la cita.

- **GET `/citas/:citaId/imagenes`**
  - **Descripción:** se muestra el código que lista las imágenes de una cita.  
    `ImagenesService.findByCita` recupera las imágenes y el controlador retorna solo los metadatos (sin el buffer binario) para optimizar el rendimiento.

- **GET `/citas/:citaId/imagenes/:id/ver`**
  - **Descripción:** se muestra el código para servir la imagen binaria al navegador.  
    `ImagenesService.findOne` obtiene la imagen, el controlador configura las cabeceras `Content-Type` y `Content-Disposition`, y envía el contenido binario al cliente.

#### Código del controlador `ImagenesController`

```ts
@ApiTags('Imágenes RM')
@ApiBearerAuth()
@Controller('citas/:citaId/imagenes')
export class ImagenesController {

  constructor(private readonly imagenesService: ImagenesService) { }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('imagenes', 10, {
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      cb(null, allowed.includes(file.mimetype));
    },
  }))
  async upload(
    @Param('citaId', ParseUUIDPipe) citaId: string,
    @UploadedFiles() archivos: Express.Multer.File[],
  ) {
    return this.imagenesService.guardarImagenes(citaId, archivos);
  }

  @Get()
  async listar(@Param('citaId', ParseUUIDPipe) citaId: string) {
    const imgs = await this.imagenesService.findByCita(citaId);
    return imgs.map(({ datos: _, ...meta }) => meta);
  }

  @Get(':id/ver')
  async verImagen(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const imagen = await this.imagenesService.findOne(id);
    res.setHeader('Content-Type', imagen.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${imagen.nombreArchivo}"`);
    res.send(imagen.datos);
  }
}
```

---

## G) MÓDULO DE DIAGNÓSTICO IA (`diagnostico`)

### Descripción general

El módulo `diagnostico` implementa el flujo de análisis automático de imágenes RM y dictado médico para generar un diagnóstico asistido por IA por cada cita. Sus endpoints se anidan bajo `/citas/:citaId/diagnostico`.

### Endpoints principales

- **POST `/citas/:citaId/diagnostico`**
  - **Descripción:** se muestra el código para iniciar el diagnóstico IA asociado a una cita.  
    El endpoint acepta multipart/form-data y soporta dos modos:
    - **Modo producción:** archivo de audio en el campo `audio` y parámetro `modeloSeleccionado`.  
    - **Modo pruebas:** solo el campo `textoManual` (dictado en texto) y `modeloSeleccionado`.  
    Las imágenes de RM deben haberse subido previamente en `POST /citas/:citaId/imagenes`.  
    El controlador llama a `DiagnosticoService.procesarCita`, que coordina la detección de hernias, la transcripción del audio (si existe) y la generación del informe de IA.

- **GET `/citas/:citaId/diagnostico`**
  - **Descripción:** se muestra el código que obtiene el diagnóstico asociado a una cita.  
    `DiagnosticoService.findByCita` retorna el resumen del diagnóstico, puntuaciones de severidad y demás campos necesarios para la pantalla de resultados en el frontend.

- **PUT `/citas/:citaId/diagnostico/aprobar`**
  - **Descripción:** se muestra el código para que el médico apruebe o ajuste el diagnóstico generado por IA.  
    El endpoint recibe un `AprobarDiagnosticoDto` con la decisión del médico y comentarios clínicos; `DiagnosticoService.aprobar` registra la validación y puede actualizar los datos para entrenamiento futuro del modelo.

- **GET `/citas/:citaId/diagnostico/tendencia/:pacienteId`**
  - **Descripción:** se muestra el código que devuelve datos de tendencia histórica del paciente.  
    `DiagnosticoService.getTendencia` agrega información de diagnósticos previos para construir las curvas de evolución del dolor y severidad que visualiza el médico en el frontend.

#### Código del controlador `DiagnosticoController`

```ts
@ApiTags('Diagnóstico IA')
@ApiBearerAuth()
@Controller('citas/:citaId/diagnostico')
export class DiagnosticoController {

  constructor(private readonly diagnosticoService: DiagnosticoService) { }

  @Post()
  @ApiOperation({
    summary: 'Iniciar diagnóstico IA',
    description: `
Acepta **dos modos**:

**Modo producción** — multipart/form-data con campo \`audio\` (archivo) y opcionalmente \`textoManual\`

**Modo pruebas** — multipart/form-data con solo \`textoManual\` (sin audio)

En ambos casos las imágenes RM deben haber sido subidas previamente en \`POST /citas/:id/imagenes\`
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['modeloSeleccionado'],
      properties: {
        modeloSeleccionado: {
          type: 'string',
          description: 'Nombre del modelo YOLO seleccionado (el de mayor confianza)',
          example: 'yolo-hernia-v2',
        },
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de audio (opcional en modo pruebas)',
        },
        textoManual: {
          type: 'string',
          description: 'Texto del dictado médico (alternativa al audio)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('audio', {
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
      cb(null, allowed.includes(file.mimetype));
    },
  }))
  async procesarCita(
    @Param('citaId', ParseUUIDPipe) citaId: string,
    @UploadedFile() audio: Express.Multer.File | undefined,
    @Body() dto: IniciarDiagnosticoDto,
  ) {
    return this.diagnosticoService.procesarCita(citaId, dto.modeloSeleccionado, audio, dto.textoManual);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener diagnóstico de una cita' })
  findByCita(@Param('citaId', ParseUUIDPipe) citaId: string) {
    return this.diagnosticoService.findByCita(citaId);
  }

  @Put('aprobar')
  @ApiOperation({ summary: 'Doctor aprueba y valida el diagnóstico generado por IA' })
  aprobar(
    @Param('citaId', ParseUUIDPipe) citaId: string,
    @Body() dto: AprobarDiagnosticoDto,
  ) {
    return this.diagnosticoService.aprobar(citaId, dto);
  }

  @Get('tendencia/:pacienteId')
  @ApiOperation({ summary: 'Datos de tendencia histórica del paciente para gráficas' })
  tendencia(@Param('pacienteId', ParseUUIDPipe) pacienteId: string) {
    return this.diagnosticoService.getTendencia(pacienteId);
  }
}
```

---

## H) MÓDULOS DE INTEGRACIÓN

### Integración de detección de hernia (`integrations/detection`)

- **Descripción general:** se muestra el código que encapsula la comunicación con el servicio de detección de hernias (por ejemplo, modelos YOLOv8).  
  El módulo `DetectionModule` expone un `DetectionController` con endpoints como `POST /detection/predict` que reciben parámetros (`PredictDto`) y retornan cajas de detección y puntuaciones de confianza.

- **Uso en otros módulos:** el servicio `DetectionService` es invocado desde `DiagnosticoService` para procesar las imágenes RM y obtener las regiones sospechosas de hernia antes de construir el informe final.

### Integración de IA de lenguaje (`integrations/ai`)

- **Descripción general:** se muestra el código que centraliza el acceso a proveedores de IA de lenguaje como Gemini y OpenAI.  
  El módulo `AiModule` define la interfaz `AiProvider` e implementaciones como `GeminiProvider` y `OpenAiProvider`, además de un `AiController` con endpoints de prueba (`POST /ai/completion`, etc.).

- **Uso en diagnóstico:** `DiagnosticoService` construye un prompt clínico mediante `prompt-builder.ts` y delega en el proveedor de IA seleccionado para generar un reporte textual comprensible para el médico.

### Integración de transcripción (`integrations/translate`)

- **Descripción general:** se muestra el código para transcribir audio clínico a texto.  
  El módulo `TranslateModule` contiene `TranslateController` con endpoints como `POST /translate/transcribe` que reciben un archivo de audio (`TranscribeDto`) y devuelven el texto transcrito.  
  Este resultado se emplea como entrada textual adicional para el módulo de diagnóstico IA.

---

## I) MÓDULO DE NOTIFICACIONES (`notificaciones`)

### Descripción general

El módulo `notificaciones` encapsula la lógica para enviar mensajes a canales externos (por ejemplo, WhatsApp) cuando se crean citas, se reprograman o se generan diagnósticos relevantes.

### Funcionalidad principal

- **Servicio de notificaciones (`NotificacionesService`)**
  - **Descripción:** se muestra el código que construye el payload (`WhatsappPayloadDto`) con los datos del paciente, la cita y el mensaje a enviar.  
  - Se integra con el proveedor externo de mensajería configurado en el entorno, manejando errores de conexión y reintentos según la implementación.

---

## J) CONFIGURACIÓN, SEEDING Y UTILIDADES COMUNES

### Configuración de entorno y base de datos

- **`env.config.ts` y `db.config.ts`**
  - **Descripción:** se muestra el código que carga variables de entorno (puerto, URL de base de datos, claves de API, etc.) y configura la conexión ORM hacia la base de datos donde se almacenan pacientes, citas, diagnósticos e imágenes.

### Módulo de seeding (`config/seeding`)

- **`SeedModule`, `SeedService`, `seed.ts`**
  - **Descripción:** se muestra el código para poblar la base de datos con datos iniciales (usuarios de prueba, roles, pacientes de ejemplo, etc.).  
  - El script `seed.ts` ejecuta el servicio de seeding, lo que facilita tener un entorno listo para demostraciones y pruebas.

### Utilidades y tipos comunes (`common`)

- **Enumerados (`role.enum.ts`, `action.enum.ts`, `resource.enum.ts`, etc.)**
  - **Descripción:** se muestra el código que define constantes de negocio utilizadas en autorizaciones y reglas de auditoría.

- **DTOs base (`base-response.dto.ts`, `pagination-filter.dto.ts`)**
  - **Descripción:** se muestra el código de estructuras de respuesta y filtros de paginación usados en varios módulos para mantener coherencia en la API.

- **Decoradores y guards (`auth.decorator.ts`, `roles.guard.ts`, `jwt-auth.guard.ts`, etc.)**
  - **Descripción:** se muestra el código que simplifica la protección de endpoints, combinando el uso de JWT, roles y permisos.

---

Este manual resume la estructura del código del backend y la responsabilidad principal de cada módulo y endpoint.  
Cualquier nueva funcionalidad o módulo agregado al sistema deberá documentarse siguiendo el mismo formato, indicando:

- Prefijo de ruta.  
- Endpoints principales.  
- DTOs y entidades involucrados.  
- Descripción de la lógica de negocio implementada en el servicio correspondiente.

