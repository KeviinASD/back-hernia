# Módulos: Pacientes & Historia Clínica
## Sistema de Detección de Hernia en Disco Lumbar

> **Stack:** NestJS · TypeORM · PostgreSQL  
> **Versión doc:** 1.0  
> **Módulos cubiertos:** `pacientes` · `historia-clinica`

---

## Tabla de Contenidos

1. [Estructura de carpetas](#1-estructura-de-carpetas)
2. [Entidades y esquema de base de datos](#2-entidades-y-esquema-de-base-de-datos)
3. [DTOs](#3-dtos)
4. [Servicios](#4-servicios)
5. [Controladores y endpoints](#5-controladores-y-endpoints)
6. [Módulo NestJS](#6-módulo-nestjs)
7. [Migraciones SQL](#7-migraciones-sql)
8. [Validaciones y reglas de negocio](#8-validaciones-y-reglas-de-negocio)
9. [Guía de implementación paso a paso](#9-guía-de-implementación-paso-a-paso)

---

## 1. Estructura de carpetas

```
src/
├── pacientes/
│   ├── entities/
│   │   └── paciente.entity.ts
│   ├── dto/
│   │   ├── create-paciente.dto.ts
│   │   └── update-paciente.dto.ts
│   ├── pacientes.controller.ts
│   ├── pacientes.service.ts
│   └── pacientes.module.ts
│
└── historia-clinica/
    ├── entities/
    │   └── historia-clinica.entity.ts
    ├── dto/
    │   ├── create-historia-clinica.dto.ts
    │   └── update-historia-clinica.dto.ts
    ├── historia-clinica.controller.ts
    ├── historia-clinica.service.ts
    └── historia-clinica.module.ts
```

---

## 2. Entidades y esquema de base de datos

### 2.1 Entidad `Paciente`

```typescript
// src/pacientes/entities/paciente.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany,
} from 'typeorm';
import { HistoriaClinica } from '../../historia-clinica/entities/historia-clinica.entity';

@Entity('pacientes')
export class Paciente {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  dni: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  @Column({ type: 'char', length: 1 })
  sexo: 'M' | 'F';

  @Column({ length: 20, nullable: true })
  telefono: string;                        // Se usará para envío por WhatsApp

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ['sedentaria', 'moderada', 'pesada'],
    nullable: true,
  })
  ocupacion: 'sedentaria' | 'moderada' | 'pesada';

  @Column({ default: false })
  tabaquismo: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  peso_kg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  talla_cm: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  imc: number;                             // Calculado automáticamente en el servicio

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relaciones
  @OneToOne(() => HistoriaClinica, (hc) => hc.paciente, { cascade: true })
  historia_clinica: HistoriaClinica;
}
```

---

### 2.2 Entidad `HistoriaClinica`

```typescript
// src/historia-clinica/entities/historia-clinica.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('historia_clinica')
export class HistoriaClinica {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Relación ────────────────────────────────────────────────────────────────
  @OneToOne(() => Paciente, (p) => p.historia_clinica, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  // ── Comorbilidades ───────────────────────────────────────────────────────────
  @Column({ default: false })
  diabetes: boolean;

  @Column({
    type: 'enum',
    enum: ['tipo1', 'tipo2'],
    nullable: true,
  })
  tipo_diabetes: 'tipo1' | 'tipo2' | null;

  @Column({ default: false })
  artrosis: boolean;

  @Column({ default: false })
  insuficiencia_renal: boolean;

  @Column({
    type: 'enum',
    enum: ['leve', 'moderada', 'severa'],
    nullable: true,
  })
  grado_ir: 'leve' | 'moderada' | 'severa' | null;

  @Column({ default: false })
  osteoporosis: boolean;

  @Column({ default: false })
  hipertension: boolean;

  @Column({ default: false })
  obesidad: boolean;

  // ── Historia de dolor lumbar ─────────────────────────────────────────────────
  @Column({ type: 'int', nullable: true })
  tiempo_evolucion_meses: number;

  @Column({ type: 'smallint', nullable: true })
  eva_inicial: number;                     // Escala 0-10 en primera consulta

  @Column({
    type: 'enum',
    enum: ['ninguna', 'glutea', 'ciatica_derecha', 'ciatica_izquierda', 'bilateral'],
    nullable: true,
  })
  irradiacion: string;

  @Column({
    type: 'enum',
    enum: ['mecanico', 'inflamatorio', 'mixto'],
    nullable: true,
  })
  tipo_dolor: 'mecanico' | 'inflamatorio' | 'mixto' | null;

  @Column({ type: 'text', array: true, nullable: true })
  factores_agravantes: string[];           // ['sedestacion', 'bipedestacion', 'esfuerzo']

  // ── Signos neurológicos ──────────────────────────────────────────────────────
  @Column({ default: false })
  parestesias: boolean;

  @Column({ default: false })
  deficit_motor: boolean;

  @Column({ default: false })
  perdida_sensibilidad: boolean;

  @Column({ default: false })
  signo_lasegue: boolean;                  // Test neurológico clave en hernia lumbar

  @Column({
    type: 'enum',
    enum: ['L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1', 'multiple'],
    nullable: true,
  })
  nivel_afectado_previo: string | null;

  // ── Tratamientos previos ─────────────────────────────────────────────────────
  @Column({ default: false })
  fisioterapia_previa: boolean;

  @Column({ default: false })
  cirugias_previas_columna: boolean;

  @Column({ default: false })
  infiltraciones_previas: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  medicacion_actual: string[];

  // ── Metadatos ────────────────────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  observaciones_adicionales: string;

  @UpdateDateColumn()
  updated_at: Date;
}
```

---

### 2.3 Schema SQL (para referencia o migración manual)

```sql
-- Tabla pacientes
CREATE TABLE pacientes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni               VARCHAR(20)  UNIQUE NOT NULL,
  nombre            VARCHAR(100) NOT NULL,
  apellido          VARCHAR(100) NOT NULL,
  fecha_nacimiento  DATE         NOT NULL,
  sexo              CHAR(1)      NOT NULL CHECK (sexo IN ('M', 'F')),
  telefono          VARCHAR(20),
  email             VARCHAR(150),
  ocupacion         VARCHAR(20)  CHECK (ocupacion IN ('sedentaria', 'moderada', 'pesada')),
  tabaquismo        BOOLEAN      DEFAULT false,
  peso_kg           DECIMAL(5,2),
  talla_cm          DECIMAL(5,2),
  imc               DECIMAL(4,2),
  activo            BOOLEAN      DEFAULT true,
  created_at        TIMESTAMP    DEFAULT NOW(),
  updated_at        TIMESTAMP    DEFAULT NOW()
);

-- Tabla historia_clinica
CREATE TABLE historia_clinica (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id                 UUID UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,

  -- Comorbilidades
  diabetes                    BOOLEAN DEFAULT false,
  tipo_diabetes               VARCHAR(10) CHECK (tipo_diabetes IN ('tipo1','tipo2')),
  artrosis                    BOOLEAN DEFAULT false,
  insuficiencia_renal         BOOLEAN DEFAULT false,
  grado_ir                    VARCHAR(10) CHECK (grado_ir IN ('leve','moderada','severa')),
  osteoporosis                BOOLEAN DEFAULT false,
  hipertension                BOOLEAN DEFAULT false,
  obesidad                    BOOLEAN DEFAULT false,

  -- Historia de dolor lumbar
  tiempo_evolucion_meses      INTEGER,
  eva_inicial                 SMALLINT CHECK (eva_inicial BETWEEN 0 AND 10),
  irradiacion                 VARCHAR(30),
  tipo_dolor                  VARCHAR(20) CHECK (tipo_dolor IN ('mecanico','inflamatorio','mixto')),
  factores_agravantes         TEXT[],

  -- Signos neurológicos
  parestesias                 BOOLEAN DEFAULT false,
  deficit_motor               BOOLEAN DEFAULT false,
  perdida_sensibilidad        BOOLEAN DEFAULT false,
  signo_lasegue               BOOLEAN DEFAULT false,
  nivel_afectado_previo       VARCHAR(20),

  -- Tratamientos previos
  fisioterapia_previa         BOOLEAN DEFAULT false,
  cirugias_previas_columna    BOOLEAN DEFAULT false,
  infiltraciones_previas      BOOLEAN DEFAULT false,
  medicacion_actual           TEXT[],

  observaciones_adicionales   TEXT,
  updated_at                  TIMESTAMP DEFAULT NOW()
);
```

---

## 3. DTOs

### 3.1 `CreatePacienteDto`

```typescript
// src/pacientes/dto/create-paciente.dto.ts

import {
  IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional,
  IsBoolean, IsNumber, IsEmail, Length, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePacienteDto {

  @ApiProperty({ example: '45678901' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  dni: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nombre: string;

  @ApiProperty({ example: 'Ramírez' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  apellido: string;

  @ApiProperty({ example: '1980-05-15' })
  @IsDateString()
  fecha_nacimiento: string;

  @ApiProperty({ enum: ['M', 'F'] })
  @IsEnum(['M', 'F'])
  sexo: 'M' | 'F';

  @ApiPropertyOptional({ example: '+51987654321' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'carlos@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: ['sedentaria', 'moderada', 'pesada'] })
  @IsOptional()
  @IsEnum(['sedentaria', 'moderada', 'pesada'])
  ocupacion?: 'sedentaria' | 'moderada' | 'pesada';

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  tabaquismo?: boolean;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(300)
  peso_kg?: number;

  @ApiPropertyOptional({ example: 170.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(250)
  talla_cm?: number;

  // IMC NO se envía; se calcula automáticamente en el servicio
}
```

---

### 3.2 `UpdatePacienteDto`

```typescript
// src/pacientes/dto/update-paciente.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreatePacienteDto } from './create-paciente.dto';

export class UpdatePacienteDto extends PartialType(CreatePacienteDto) {}
```

---

### 3.3 `CreateHistoriaClinicaDto`

```typescript
// src/historia-clinica/dto/create-historia-clinica.dto.ts

import {
  IsBoolean, IsEnum, IsOptional, IsInt,
  IsArray, IsString, Min, Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHistoriaClinicaDto {

  // ── Comorbilidades ───────────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  diabetes?: boolean;

  @ApiPropertyOptional({ enum: ['tipo1', 'tipo2'] })
  @IsOptional() @IsEnum(['tipo1', 'tipo2'])
  tipo_diabetes?: 'tipo1' | 'tipo2';

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  artrosis?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  insuficiencia_renal?: boolean;

  @ApiPropertyOptional({ enum: ['leve', 'moderada', 'severa'] })
  @IsOptional() @IsEnum(['leve', 'moderada', 'severa'])
  grado_ir?: 'leve' | 'moderada' | 'severa';

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  osteoporosis?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  hipertension?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  obesidad?: boolean;

  // ── Historia de dolor lumbar ─────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 6 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  tiempo_evolucion_meses?: number;

  @ApiPropertyOptional({ example: 7, minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10)
  eva_inicial?: number;

  @ApiPropertyOptional({
    enum: ['ninguna', 'glutea', 'ciatica_derecha', 'ciatica_izquierda', 'bilateral'],
  })
  @IsOptional()
  @IsEnum(['ninguna', 'glutea', 'ciatica_derecha', 'ciatica_izquierda', 'bilateral'])
  irradiacion?: string;

  @ApiPropertyOptional({ enum: ['mecanico', 'inflamatorio', 'mixto'] })
  @IsOptional() @IsEnum(['mecanico', 'inflamatorio', 'mixto'])
  tipo_dolor?: 'mecanico' | 'inflamatorio' | 'mixto';

  @ApiPropertyOptional({ example: ['sedestacion', 'esfuerzo'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  factores_agravantes?: string[];

  // ── Signos neurológicos ──────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  parestesias?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  deficit_motor?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  perdida_sensibilidad?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  signo_lasegue?: boolean;

  @ApiPropertyOptional({ enum: ['L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1', 'multiple'] })
  @IsOptional()
  @IsEnum(['L1-L2', 'L2-L3', 'L3-L4', 'L4-L5', 'L5-S1', 'multiple'])
  nivel_afectado_previo?: string;

  // ── Tratamientos previos ─────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  fisioterapia_previa?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  cirugias_previas_columna?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  infiltraciones_previas?: boolean;

  @ApiPropertyOptional({ example: ['ibuprofeno', 'pregabalina'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  medicacion_actual?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones_adicionales?: string;
}
```

---

### 3.4 `UpdateHistoriaClinicaDto`

```typescript
// src/historia-clinica/dto/update-historia-clinica.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateHistoriaClinicaDto } from './create-historia-clinica.dto';

export class UpdateHistoriaClinicaDto extends PartialType(CreateHistoriaClinicaDto) {}
```

---

## 4. Servicios

### 4.1 `PacientesService`

```typescript
// src/pacientes/pacientes.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacientesService {

  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
  ) {}

  // ── Crear paciente ───────────────────────────────────────────────────────────
  async create(dto: CreatePacienteDto): Promise<Paciente> {
    const existe = await this.pacienteRepo.findOne({ where: { dni: dto.dni } });
    if (existe) throw new ConflictException(`Ya existe un paciente con DNI ${dto.dni}`);

    const paciente = this.pacienteRepo.create({
      ...dto,
      imc: this.calcularIMC(dto.peso_kg, dto.talla_cm),
    });

    return this.pacienteRepo.save(paciente);
  }

  // ── Listar todos ─────────────────────────────────────────────────────────────
  async findAll(): Promise<Paciente[]> {
    return this.pacienteRepo.find({
      where: { activo: true },
      relations: ['historia_clinica'],
      order: { created_at: 'DESC' },
    });
  }

  // ── Buscar por ID ─────────────────────────────────────────────────────────────
  async findOne(id: string): Promise<Paciente> {
    const paciente = await this.pacienteRepo.findOne({
      where: { id },
      relations: ['historia_clinica'],
    });
    if (!paciente) throw new NotFoundException(`Paciente ${id} no encontrado`);
    return paciente;
  }

  // ── Buscar por DNI ────────────────────────────────────────────────────────────
  async findByDni(dni: string): Promise<Paciente> {
    const paciente = await this.pacienteRepo.findOne({
      where: { dni },
      relations: ['historia_clinica'],
    });
    if (!paciente) throw new NotFoundException(`Paciente con DNI ${dni} no encontrado`);
    return paciente;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdatePacienteDto): Promise<Paciente> {
    const paciente = await this.findOne(id);

    // Recalcular IMC si cambia peso o talla
    const pesoFinal  = dto.peso_kg  ?? paciente.peso_kg;
    const tallaFinal = dto.talla_cm ?? paciente.talla_cm;

    Object.assign(paciente, dto, {
      imc: this.calcularIMC(pesoFinal, tallaFinal),
    });

    return this.pacienteRepo.save(paciente);
  }

  // ── Soft delete (desactivar) ──────────────────────────────────────────────────
  async remove(id: string): Promise<void> {
    const paciente = await this.findOne(id);
    paciente.activo = false;
    await this.pacienteRepo.save(paciente);
  }

  // ── Helper: cálculo de IMC ────────────────────────────────────────────────────
  private calcularIMC(peso?: number, talla?: number): number | null {
    if (!peso || !talla) return null;
    const tallaMts = talla / 100;
    return parseFloat((peso / (tallaMts * tallaMts)).toFixed(2));
  }
}
```

---

### 4.2 `HistoriaClinicaService`

```typescript
// src/historia-clinica/historia-clinica.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia-clinica.dto';

@Injectable()
export class HistoriaClinicaService {

  constructor(
    @InjectRepository(HistoriaClinica)
    private readonly hcRepo: Repository<HistoriaClinica>,

    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
  ) {}

  // ── Crear historia clínica para un paciente ──────────────────────────────────
  async create(pacienteId: string, dto: CreateHistoriaClinicaDto): Promise<HistoriaClinica> {
    const paciente = await this.pacienteRepo.findOne({ where: { id: pacienteId } });
    if (!paciente) throw new NotFoundException(`Paciente ${pacienteId} no encontrado`);

    const existente = await this.hcRepo.findOne({ where: { paciente: { id: pacienteId } } });
    if (existente) throw new ConflictException('Este paciente ya tiene una historia clínica');

    const hc = this.hcRepo.create({ ...dto, paciente });
    return this.hcRepo.save(hc);
  }

  // ── Obtener historia clínica por paciente ─────────────────────────────────────
  async findByPaciente(pacienteId: string): Promise<HistoriaClinica> {
    const hc = await this.hcRepo.findOne({
      where: { paciente: { id: pacienteId } },
      relations: ['paciente'],
    });
    if (!hc) throw new NotFoundException(`Historia clínica no encontrada para paciente ${pacienteId}`);
    return hc;
  }

  // ── Actualizar historia clínica ───────────────────────────────────────────────
  async update(pacienteId: string, dto: UpdateHistoriaClinicaDto): Promise<HistoriaClinica> {
    const hc = await this.findByPaciente(pacienteId);
    Object.assign(hc, dto);
    return this.hcRepo.save(hc);
  }

  // ── Método para el módulo de diagnóstico IA ───────────────────────────────────
  // Retorna la HC formateada lista para incluir en el prompt de Gemini
  async getContextoParaIA(pacienteId: string): Promise<object> {
    const hc = await this.findByPaciente(pacienteId);
    const p  = hc.paciente;

    return {
      // Datos del paciente
      edad:      this.calcularEdad(p.fecha_nacimiento),
      sexo:      p.sexo,
      imc:       p.imc,
      ocupacion: p.ocupacion,
      tabaquismo: p.tabaquismo,

      // Comorbilidades
      comorbilidades: {
        diabetes:            hc.diabetes,
        tipo_diabetes:       hc.tipo_diabetes,
        artrosis:            hc.artrosis,
        insuficiencia_renal: hc.insuficiencia_renal,
        grado_ir:            hc.grado_ir,
        osteoporosis:        hc.osteoporosis,
        hipertension:        hc.hipertension,
        obesidad:            hc.obesidad,
      },

      // Historia lumbar
      dolor_lumbar: {
        tiempo_evolucion_meses: hc.tiempo_evolucion_meses,
        eva_inicial:            hc.eva_inicial,
        tipo_dolor:             hc.tipo_dolor,
        irradiacion:            hc.irradiacion,
        factores_agravantes:    hc.factores_agravantes,
      },

      // Neurológico
      signos_neurologicos: {
        parestesias:          hc.parestesias,
        deficit_motor:        hc.deficit_motor,
        perdida_sensibilidad: hc.perdida_sensibilidad,
        signo_lasegue:        hc.signo_lasegue,
        nivel_afectado_previo: hc.nivel_afectado_previo,
      },

      // Tratamientos previos
      antecedentes: {
        fisioterapia_previa:      hc.fisioterapia_previa,
        cirugias_previas_columna: hc.cirugias_previas_columna,
        infiltraciones_previas:   hc.infiltraciones_previas,
        medicacion_actual:        hc.medicacion_actual,
      },
    };
  }

  private calcularEdad(fechaNacimiento: Date): number {
    const hoy   = new Date();
    const nacim = new Date(fechaNacimiento);
    let edad    = hoy.getFullYear() - nacim.getFullYear();
    const mes   = hoy.getMonth() - nacim.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacim.getDate())) edad--;
    return edad;
  }
}
```

---

## 5. Controladores y endpoints

### 5.1 `PacientesController`

```typescript
// src/pacientes/pacientes.controller.ts

import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';     // ya existe en tu proyecto
import { RolesGuard } from '../auth/guards/roles.guard';           // ya existe en tu proyecto
import { Roles } from '../auth/decorators/roles.decorator';        // ya existe en tu proyecto

@ApiTags('Pacientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pacientes')
export class PacientesController {

  constructor(private readonly pacientesService: PacientesService) {}

  // POST /pacientes
  @Post()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Crear nuevo paciente' })
  create(@Body() dto: CreatePacienteDto) {
    return this.pacientesService.create(dto);
  }

  // GET /pacientes
  @Get()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Listar todos los pacientes activos' })
  findAll() {
    return this.pacientesService.findAll();
  }

  // GET /pacientes/:id
  @Get(':id')
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacientesService.findOne(id);
  }

  // GET /pacientes/dni/:dni
  @Get('dni/:dni')
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Buscar paciente por DNI' })
  findByDni(@Param('dni') dni: string) {
    return this.pacientesService.findByDni(dni);
  }

  // PUT /pacientes/:id
  @Put(':id')
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Actualizar datos del paciente' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePacienteDto,
  ) {
    return this.pacientesService.update(id, dto);
  }

  // DELETE /pacientes/:id  (soft delete)
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Desactivar paciente (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacientesService.remove(id);
  }
}
```

---

### 5.2 `HistoriaClinicaController`

```typescript
// src/historia-clinica/historia-clinica.controller.ts

import {
  Controller, Get, Post, Put,
  Param, Body, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HistoriaClinicaService } from './historia-clinica.service';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia-clinica.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Historia Clínica')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pacientes/:pacienteId/historia-clinica')
export class HistoriaClinicaController {

  constructor(private readonly hcService: HistoriaClinicaService) {}

  // POST /pacientes/:pacienteId/historia-clinica
  @Post()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Crear historia clínica del paciente' })
  create(
    @Param('pacienteId', ParseUUIDPipe) pacienteId: string,
    @Body() dto: CreateHistoriaClinicaDto,
  ) {
    return this.hcService.create(pacienteId, dto);
  }

  // GET /pacientes/:pacienteId/historia-clinica
  @Get()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Obtener historia clínica del paciente' })
  findOne(@Param('pacienteId', ParseUUIDPipe) pacienteId: string) {
    return this.hcService.findByPaciente(pacienteId);
  }

  // PUT /pacientes/:pacienteId/historia-clinica
  @Put()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Actualizar historia clínica' })
  update(
    @Param('pacienteId', ParseUUIDPipe) pacienteId: string,
    @Body() dto: UpdateHistoriaClinicaDto,
  ) {
    return this.hcService.update(pacienteId, dto);
  }
}
```

---

## 6. Módulo NestJS

### 6.1 `PacientesModule`

```typescript
// src/pacientes/pacientes.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './entities/paciente.entity';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Paciente])],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],          // exportado para que DiagnosticoModule lo use
})
export class PacientesModule {}
```

---

### 6.2 `HistoriaClinicaModule`

```typescript
// src/historia-clinica/historia-clinica.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { HistoriaClinicaService } from './historia-clinica.service';
import { HistoriaClinicaController } from './historia-clinica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HistoriaClinica, Paciente])],
  controllers: [HistoriaClinicaController],
  providers: [HistoriaClinicaService],
  exports: [HistoriaClinicaService],    // exportado para que DiagnosticoModule lo use
})
export class HistoriaClinicaModule {}
```

---

### 6.3 Registrar en `AppModule`

```typescript
// src/app.module.ts  — agregar los imports nuevos

import { PacientesModule } from './pacientes/pacientes.module';
import { HistoriaClinicaModule } from './historia-clinica/historia-clinica.module';

@Module({
  imports: [
    // ... tus módulos existentes
    PacientesModule,
    HistoriaClinicaModule,
  ],
})
export class AppModule {}
```

---

## 7. Migraciones SQL

Si usas TypeORM con `synchronize: false` (recomendado en producción), genera la migración:

```bash
# Generar migración automáticamente desde las entidades
npx typeorm migration:generate src/migrations/CreatePacientesAndHistoriaClinica -d src/data-source.ts

# Ejecutar migración
npx typeorm migration:run -d src/data-source.ts
```

O usa el SQL del apartado 2.3 directamente en tu cliente PostgreSQL.

---

## 8. Validaciones y reglas de negocio

| Regla | Dónde se aplica |
|---|---|
| DNI único por paciente | `PacientesService.create()` → lanza `ConflictException` |
| IMC calculado automáticamente | `PacientesService.create()` y `update()` |
| Un paciente tiene exactamente una HC | `HistoriaClinicaService.create()` → lanza `ConflictException` |
| HC creada en endpoint anidado `/pacientes/:id/historia-clinica` | Controlador |
| Solo `admin` puede eliminar pacientes | Guard `@Roles('admin')` en `DELETE` |
| `tipo_diabetes` solo si `diabetes: true` | Validar en frontend o agregar `@ValidateIf` |
| `grado_ir` solo si `insuficiencia_renal: true` | Validar en frontend o agregar `@ValidateIf` |
| Soft delete: nunca borrar físicamente | `activo = false` en lugar de `DELETE` |

---

## 9. Guía de implementación paso a paso

Sigue este orden para evitar errores de dependencias:

```
Paso 1 — Crear entidades
  └── paciente.entity.ts
  └── historia-clinica.entity.ts

Paso 2 — Registrar entidades en TypeORM
  └── app.module.ts → TypeOrmModule.forFeature([...])

Paso 3 — Ejecutar migración / synchronize
  └── npx typeorm migration:run  o  synchronize: true en dev

Paso 4 — Crear DTOs con validaciones

Paso 5 — Implementar servicios
  └── PacientesService (sin dependencia de HC)
  └── HistoriaClinicaService (depende de PacienteRepo)

Paso 6 — Implementar controladores

Paso 7 — Crear módulos y exportar servicios

Paso 8 — Importar módulos en AppModule

Paso 9 — Probar endpoints en Swagger (localhost:3000/api)
```

### Endpoints disponibles tras la implementación

```
# Pacientes
POST   /pacientes                          Crear paciente
GET    /pacientes                          Listar todos
GET    /pacientes/:id                      Ver por ID
GET    /pacientes/dni/:dni                 Buscar por DNI
PUT    /pacientes/:id                      Actualizar
DELETE /pacientes/:id                      Desactivar (solo admin)

# Historia Clínica
POST   /pacientes/:pacienteId/historia-clinica    Crear HC
GET    /pacientes/:pacienteId/historia-clinica    Ver HC
PUT    /pacientes/:pacienteId/historia-clinica    Actualizar HC
```

---

> **Siguiente módulo recomendado:** `citas` + `imagenes-rm`  
> Una vez creado ese módulo, el módulo de `diagnostico` puede usar `HistoriaClinicaService.getContextoParaIA()` para armar el prompt de Gemini con toda la información clínica del paciente.