import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas para el dashboard. Opcional: filtrar por últimos N meses.' })
  @ApiQuery({ name: 'meses', required: false, description: 'Últimos N meses (1, 3, 4, 6, 12). Por defecto 4.' })
  getStats(@Query('meses') meses?: string) {
    const mesesNum = meses ? Math.min(12, Math.max(1, parseInt(meses, 10) || 4)) : 4;
    return this.dashboardService.getStats(undefined, mesesNum);
  }
}
