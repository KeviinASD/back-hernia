import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { EstadoCita } from './entities/cita.entity';
import { CitasService } from './cita.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { FilterCitaDto } from './dto/filter-cita.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateCitaDto } from './dto/update-cita.dto';

@ApiTags('Citas')
@ApiBearerAuth()
@Controller('citas')
export class CitasController {
    constructor(private readonly citasService: CitasService) { }

    // POST /citas
    @Post()
    @ApiOperation({ summary: 'Programar una nueva cita' })
    @ApiResponse({ status: 201, description: 'Cita creada exitosamente.' })
    @ApiResponse({ status: 400, description: 'Fecha inválida o en el pasado.' })
    @ApiResponse({ status: 409, description: 'Conflicto de horario con otra cita.' })
    create(@Body() dto: CreateCitaDto, @Request() req) {
        return this.citasService.create(dto, req.user.id);
    }

    // GET /citas
    @Get()
    @ApiOperation({ summary: 'Listar citas con filtros opcionales' })
    findAll(@Query() filters: FilterCitaDto) {
        return this.citasService.findAll(filters);
    }

    // GET /citas/hoy
    @Get('hoy')
    @ApiOperation({ summary: 'Obtener citas del día para el doctor autenticado' })
    findHoy(@Request() req) {
        return this.citasService.findCitasHoy(req.user.id);
    }

    // GET /citas/stats
    @Get('stats')
    @ApiOperation({ summary: 'Estadísticas de citas por estado' })
    getStats(@Request() req, @Query('doctorId') doctorId?: string) {
        // Admin puede consultar cualquier doctor, doctor solo ve las suyas
        const targetId = req.user.rol === 'admin' ? doctorId : req.user.id;
        return this.citasService.getStats(targetId);
    }

    // GET /citas/paciente/:pacienteId
    @Get('paciente/:pacienteId')
    @ApiOperation({ summary: 'Historial de citas de un paciente' })
    @ApiParam({ name: 'pacienteId', type: 'number' })
    findByPaciente(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
        return this.citasService.findByPaciente(pacienteId);
    }

    // GET /citas/:id
    @Get(':id')
    @ApiOperation({ summary: 'Detalle completo de una cita (incluye imágenes y diagnóstico)' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.citasService.findOne(id);
    }

    // PATCH /citas/:id
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar datos de una cita (fecha, motivo, doctor)' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCitaDto,
        @Request() req,
    ) {
        return this.citasService.update(id, dto, req.user.id);
    }

    // PATCH /citas/:id/iniciar
    @Patch(':id/iniciar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marcar cita como EN_CURSO' })
    iniciar(@Param('id', ParseUUIDPipe) id: string) {
        return this.citasService.iniciar(id);
    }

    // PATCH /citas/:id/completar
    @Patch(':id/completar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Completar cita (requiere diagnóstico previo)' })
    completar(@Param('id', ParseUUIDPipe) id: string) {
        return this.citasService.completar(id);
    }

    // PATCH /citas/:id/cancelar
    @Patch(':id/cancelar')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancelar una cita programada' })
    cancelar(@Param('id', ParseUUIDPipe) id: string) {
        return this.citasService.cancelar(id);
    }
}