import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService, DatabaseConfig } from './config/env.config';
import { ConfigModule } from '@nestjs/config';
import dbConfig from './config/db.config';
import { SeedModule } from './config/seeding/seed.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { HistoriaClinicaModule } from './modules/historia-clinica/historia-clinica.module';
import { CitasModule } from './modules/citas/cita.module';
import { ImagenesModule } from './modules/imagenes/imagenes.module';
import { DiagnosticoModule } from './modules/diagnostico/diagnostico.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

const config: DatabaseConfig = configService.get<DatabaseConfig>('DATABASE');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      /* Ejm de expandVariables:
        DB_NAME=example
        URL=${DB_NAME}.com # Esto se expandirá a "example.com"
      */
      expandVariables: true,
      load: [dbConfig]
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const db = dbConfig();
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          autoLoadEntities: db.autoLoadEntities,
          synchronize: db.synchronize,
        };
      }
    }),
    AuthModule,
    UsersModule,
    SeedModule,
    IntegrationsModule,
    PacientesModule,
    HistoriaClinicaModule,
    CitasModule,
    ImagenesModule,
    DiagnosticoModule,
    NotificacionesModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
