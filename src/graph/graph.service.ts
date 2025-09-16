/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface HarmonicEntry {
  harmonicNumber: number;
  value: number;
  key: string;
}

@Injectable()
export class GraphService {
  private readonly realTimeUrl = 'http://127.0.0.1:1880/realtimelink';

  async getLatestChannelData(channel: string) {
    const { data: latestDoc } = await axios.get(this.realTimeUrl);
    if (!latestDoc) return null;

    const harmonics: HarmonicEntry[] = Object.entries(latestDoc)
      .filter(([key]) => key.endsWith(`-${channel}`))
      .map(([key, value]) => {
        const match = key.match(/(\d+)(st|nd|rd|th)\s?(harmonic|THD)/i);
        const harmonicNumber = match ? parseInt(match[1]) : 0;
        const numericValue = parseFloat((value as string).replace('%', ''));
        return { harmonicNumber, value: numericValue, key };
      })
      .filter((h) => h.harmonicNumber > 0);

    const odd = harmonics.filter((h) => h.harmonicNumber % 2 !== 0);
    const even = harmonics.filter((h) => h.harmonicNumber % 2 === 0);

    const calcTHD = (arr: HarmonicEntry[]) =>
      arr.length ? Math.sqrt(arr.reduce((sum, h) => sum + h.value ** 2, 0)) : 0;

    const getMin = (arr: HarmonicEntry[]) =>
      arr.length
        ? arr.reduce((min, h) => (h.value < min.value ? h : min), arr[0])
        : null;
    const getMax = (arr: HarmonicEntry[]) =>
      arr.length
        ? arr.reduce((max, h) => (h.value > max.value ? h : max), arr[0])
        : null;
    const getAvg = (arr: HarmonicEntry[]) =>
      arr.length ? arr.reduce((sum, h) => sum + h.value, 0) / arr.length : 0;

    const oddTHD = calcTHD(odd);
    const evenTHD = calcTHD(even);

    const oddMin = getMin(odd);
    const oddMax = getMax(odd);
    const oddAvg = getAvg(odd);

    const evenMin = getMin(even);
    const evenMax = getMax(even);
    const evenAvg = getAvg(even);

    const overallMin = getMin(harmonics);
    const overallMax = getMax(harmonics);
    const overallAvg = getAvg(harmonics);

    // present value (total THD from Node-RED)
    const presentValueKey = `SAH_MTO_PQM1_Int THD-${channel}`;
    const presentValue = latestDoc[presentValueKey] || null;

    return {
      channel,
      presentValue, // total average from Node-RED
      odd,
      even,
      stats: {
        oddTHD,
        oddMin,
        oddMax,
        oddAvg,
        evenTHD,
        evenMin,
        evenMax,
        evenAvg,
        overallMin,
        overallMax,
        overallAvg,
      },
    };
  }
}
