// src/diagnostico/prompt-builder.ts

import { PredictResponseDto } from 'src/integrations/detection/dto/predict.dto';
import { HistoriaClinica } from '../historia-clinica/entities/historia-clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Diagnostico } from './entities/diagnostico.entity';

export interface PromptContext {
    transcripcion: string;
    paciente: Paciente;
    historiaClinica: HistoriaClinica;
    resultadosML: PredictResponseDto;
    diagnosticosAnteriores: Diagnostico[];
}

export function buildDiagnosticoPrompt(ctx: PromptContext): string {
    const {
        transcripcion,
        paciente,
        historiaClinica: hc,
        resultadosML,
        diagnosticosAnteriores,
    } = ctx;

    // Calcular edad
    const hoy = new Date();
    const nac = new Date(paciente.fecha_nacimiento);
    const edad = hoy.getFullYear() - nac.getFullYear();

    // Formatear comorbilidades
    const comorbilidades: string[] = [];
    if (hc.diabetes) comorbilidades.push(`Diabetes ${hc.tipo_diabetes ?? ''}`);
    if (hc.artrosis) comorbilidades.push('Artrosis');
    if (hc.insuficiencia_renal) comorbilidades.push(`Insuficiencia Renal (${hc.grado_ir ?? 'grado no especificado'})`);
    if (hc.osteoporosis) comorbilidades.push('Osteoporosis');
    if (hc.hipertension) comorbilidades.push('Hipertensión');
    if (hc.obesidad) comorbilidades.push('Obesidad');

    // Formatear historial previo
    const historialPrevio = diagnosticosAnteriores.length === 0
        ? 'No hay citas anteriores — esta es la primera cita.'
        : diagnosticosAnteriores.map((d, i) => `
  Cita ${i + 1} (${d.createdAt.toLocaleDateString()}):
    - Tipo hernia: ${d.tipoHernia} | Nivel: ${d.nivelVertebral}
    - Score severidad: ${d.scoreSeveridad}/100 | EVA dolor: ${d.evaDolor}/10
    - Tratamiento: ${d.tratamientoIndicado} | Riesgo quirúrgico: ${d.riesgoQuirurgico}
`).join('');

    // Formatear detecciones ML
    const deteccionesTexto = resultadosML.detections
        .map(d =>
            `  [${d.label_name}] confianza=${(d.confidence * 100).toFixed(1)}% bbox=[${d.bbox.join(', ')}]`
        ).join('\n') || '  Sin detecciones';

    return `
Eres un asistente médico especializado en patología de columna lumbar.
Se te proporciona una imagen de resonancia magnética lumbar, el dictado del médico tratante
y los datos clínicos del paciente. Tu tarea es generar un diagnóstico estructurado.

═══════════════════════════════════════════════════════════
DICTADO DEL MÉDICO (transcripción literal):
═══════════════════════════════════════════════════════════
${transcripcion}

═══════════════════════════════════════════════════════════
DATOS DEL PACIENTE:
═══════════════════════════════════════════════════════════
- Edad: ${edad} años | Sexo: ${paciente.sexo} | IMC: ${paciente.imc ?? 'no registrado'}
- Ocupación: ${paciente.ocupacion ?? 'no especificada'} | Tabaquismo: ${paciente.tabaquismo ? 'Sí' : 'No'}
- Comorbilidades: ${comorbilidades.length ? comorbilidades.join(', ') : 'Ninguna registrada'}

Historia lumbar:
- Tiempo de evolución: ${hc.tiempo_evolucion_meses ?? '?'} meses
- EVA inicial: ${hc.eva_inicial ?? '?'}/10
- Tipo de dolor: ${hc.tipo_dolor ?? 'no especificado'}
- Irradiación: ${hc.irradiacion ?? 'no especificada'}
- Factores agravantes: ${hc.factores_agravantes?.join(', ') ?? 'no especificados'}

Signos neurológicos:
- Parestesias: ${hc.parestesias ? 'Sí' : 'No'}
- Déficit motor: ${hc.deficit_motor ? 'Sí' : 'No'}
- Signo Lasègue: ${hc.signo_lasegue ? 'Positivo' : 'Negativo'}
- Nivel previo afectado: ${hc.nivel_afectado_previo ?? 'No documentado'}

Antecedentes de tratamiento:
- Fisioterapia previa: ${hc.fisioterapia_previa ? 'Sí' : 'No'}
- Cirugías columna: ${hc.cirugias_previas_columna ? 'Sí' : 'No'}
- Infiltraciones: ${hc.infiltraciones_previas ? 'Sí' : 'No'}
- Medicación actual: ${hc.medicacion_actual?.join(', ') ?? 'Ninguna'}

═══════════════════════════════════════════════════════════
RESULTADOS YOLO (Machine Learning):
═══════════════════════════════════════════════════════════
- Modelo: ${resultadosML.model_used}
- Hernia detectada: ${resultadosML.hernia_detected ? 'SÍ' : 'NO'}
- Total detecciones: ${resultadosML.n_total} (${resultadosML.n_hernias} hdisc)
- Confianza media: ${(resultadosML.avg_confidence * 100).toFixed(1)}%
- Tiempo de inferencia: ${resultadosML.inference_time_s}s

Detalle de detecciones:
${deteccionesTexto}

═══════════════════════════════════════════════════════════
HISTORIAL DE CITAS ANTERIORES DEL PACIENTE:
═══════════════════════════════════════════════════════════
${historialPrevio}

═══════════════════════════════════════════════════════════
INSTRUCCIONES:
═══════════════════════════════════════════════════════════
Analiza la imagen RM adjunta en conjunto con toda la información clínica anterior.
Prioriza el dictado del médico como fuente principal. Usa los resultados ML como
confirmación adicional. Considera las comorbilidades (especialmente Diabetes,
Artrosis e Insuficiencia Renal) para ajustar el plan de tratamiento.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques markdown:

{
  "nivel_vertebral": "L4-L5",
  "tipo_hernia": "protrusión | extrusión | secuestro | no_detectada",
  "grado_compresion": 0,
  "score_severidad": 0,
  "score_funcional": 0,
  "eva_dolor": 0,
  "progresion": "mejora | estable | deterioro | primera_cita",
  "velocidad_progresion": "lenta | moderada | rapida | null",
  "riesgo_quirurgico": "bajo | medio | alto",
  "tratamiento_indicado": "conservador | infiltración | quirúrgico",
  "medicacion": ["string"],
  "semanas_seguimiento": 4,
  "diagnostico_texto": "Texto clínico completo...",
  "tratamiento_texto": "Plan de tratamiento detallado...",
  "resumen_whatsapp": "Resumen amigable para WhatsApp (máx 300 caracteres)"
}
`.trim();
}