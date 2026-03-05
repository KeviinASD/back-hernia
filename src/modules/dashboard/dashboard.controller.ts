import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas para el dashboard (KPIs, citas por mes)' })
  getStats(@Request() req: { user: { id: string; rol: string } }, @Query('doctorId') doctorId?: string) {
    const targetId = req.user.rol === 'admin' ? doctorId : req.user.id;
    return this.dashboardService.getStats(targetId);
  }
}
