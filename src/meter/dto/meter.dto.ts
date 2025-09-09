// // src/meter/dto/meter-data.dto.ts
// import { PowerEventDto } from './power-event.dto';

// export class MeterDataDto {
//   timestamp?: string;

//   // Power events
//   SAH_MTO_PQM1_PowerOn?: PowerEventDto;
//   SAH_MTO_PQM1_PowerOff?: PowerEventDto;
//   SAH_MTO_PQM1_SetupParameter?: PowerEventDto;
//   SAH_MTO_PQM1_ClearDemand?: PowerEventDto;
//   SAH_MTO_PQM1_ClearEnergy?: PowerEventDto;

//   // Voltages
//   SAH_MTO_PQM1_VOLTAGE_LINE_1_V?: string;
//   SAH_MTO_PQM1_VOLTAGE_LINE_2_V?: string;
//   SAH_MTO_PQM1_VOLTAGE_LINE_3_V?: string;
//   SAH_MTO_PQM1_VOLTAGE_LINE_1_2_V?: string;
//   SAH_MTO_PQM1_VOLTAGE_LINE_2_3_V?: string;
//   SAH_MTO_PQM1_VOLTAGE_LINE_3_1_V?: string;

//   // Currents
//   SAH_MTO_PQM1_CURRENT_LINE_1_A?: string;
//   SAH_MTO_PQM1_CURRENT_LINE_2_A?: string;
//   SAH_MTO_PQM1_CURRENT_LINE_3_A?: string;

//   // Powers
//   SAH_MTO_PQM1_ACTIVE_POWER_TOTAL_KW?: string;
//   SAH_MTO_PQM1_REACTIVE_POWER_TOTAL_KVAR?: string;
//   SAH_MTO_PQM1_APPARENT_POWER_TOTAL_KVA?: string;
//   SAH_MTO_PQM1_POWER_FACTOR_TOTAL?: string;
//   SAH_MTO_PQM1_FREQUENCY_F?: string;

//   // Dynamic / unknown fields
//   [key: string]: any;
// }
