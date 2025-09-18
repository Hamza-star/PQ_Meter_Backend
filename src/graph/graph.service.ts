/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import axios from 'axios';
import { MongoClient, Db, Collection } from 'mongodb';

interface HarmonicEntry {
  harmonicNumber: number;
  value: number;
  key: string;
}

@Injectable()
export class GraphService implements OnModuleInit, OnModuleDestroy {
  private client!: MongoClient;
  private db!: Db;
  private pqCollection!: Collection;

  async onModuleInit() {
    this.client = new MongoClient(
      'mongodb+srv://alihamza:1uEiKEgyCfNg57qb@cluster0.rtxdhjc.mongodb.net/meterData?retryWrites=true&w=majority&appName=Cluster0s',
    );
    await this.client.connect();
    this.db = this.client.db('PQ_Meter');
    this.pqCollection = this.db.collection('sample-data');
    console.log('Connected to PQ_Meter_data');
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  // Generate odd harmonic keys with fallback for 11th harmonic
  private getOddHarmonicKeys(channel: string) {
    const keys: { key: string; harmonicNumber: number; altKey?: string }[] = [];

    const getOrdinal = (n: number) => {
      if (n === 1) return '1st';
      if (n === 2) return '2nd';
      if (n === 3) return '3rd';
      return `${n}th`;
    };

    for (let i = 3; i <= 63; i += 2) {
      if (i === 11) {
        if (channel === 'V1') {
          keys.push({
            key: `SAH_MTO_PQM1_11thTHD-${channel}`, // main key for V1
            harmonicNumber: 11,
            altKey: `SAH_MTO_PQM1_11th THD-${channel}`, // fallback, not added as separate entry
          });
        } else {
          keys.push({
            key: `SAH_MTO_PQM1_11th THD-${channel}`,
            harmonicNumber: 11,
            altKey: `SAH_MTO_PQM1_11thTHD-${channel}`,
          });
        }
      } else {
        keys.push({
          key: `SAH_MTO_PQM1_${getOrdinal(i)} harmonic-${channel}`,
          harmonicNumber: i,
        });
      }
    }

    return keys;
  }

  // Aggregate odd harmonic stats
  async getOddHarmonicsStats(channel: string) {
    const harmonicKeys = this.getOddHarmonicKeys(channel);

    // Create MongoDB projection with fallback keys
    const projectStage: Record<string, any> = {};
    harmonicKeys.forEach((k) => {
      projectStage[k.key] = {
        $toDouble: {
          $replaceAll: {
            input: k.altKey
              ? { $ifNull: [`$${k.key}`, `$${k.altKey}`] }
              : `$${k.key}`,
            find: '%',
            replacement: '',
          },
        },
      };
    });

    // Aggregation pipeline
    const pipeline = [
      { $sort: { timestamp: -1 } },
      { $limit: 31 },
      { $project: projectStage },
      {
        $group: harmonicKeys.reduce(
          (acc, k) => {
            acc['_id'] = null;
            acc[`${k.key}_min`] = { $min: `$${k.key}` };
            acc[`${k.key}_max`] = { $max: `$${k.key}` };
            acc[`${k.key}_avg`] = { $avg: `$${k.key}` };
            return acc;
          },
          {} as Record<string, any>,
        ),
      },
    ];

    const result = await this.pqCollection.aggregate(pipeline).toArray();
    if (!result.length) return { channel, odd: [] };

    // Build stats array without duplicates
    const stats = harmonicKeys.map((k) => ({
      harmonicNumber: k.harmonicNumber,
      min: result[0][`${k.key}_min`] ?? null,
      max: result[0][`${k.key}_max`] ?? null,
      avg: result[0][`${k.key}_avg`] ?? null,
      key: k.key,
    }));

    return { channel, odd: stats };
  }

  // min, max THD

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

    // const getMin = (arr: HarmonicEntry[]) =>
    //   arr.length
    //     ? arr.reduce((min, h) => (h.value < min.value ? h : min), arr[0])
    //     : null;
    // const getMax = (arr: HarmonicEntry[]) =>
    //   arr.length
    //     ? arr.reduce((max, h) => (h.value > max.value ? h : max), arr[0])
    //     : null;
    // const getAvg = (arr: HarmonicEntry[]) =>
    //   arr.length ? arr.reduce((sum, h) => sum + h.value, 0) / arr.length : 0;

    const oddTHD = calcTHD(odd);
    const evenTHD = calcTHD(even);

    // const oddMin = getMin(odd);
    // const oddMax = getMax(odd);
    // const oddAvg = getAvg(odd);

    // const evenMin = getMin(even);
    // const evenMax = getMax(even);
    // const evenAvg = getAvg(even);

    // const overallMin = getMin(harmonics);
    // const overallMax = getMax(harmonics);
    // const overallAvg = getAvg(harmonics);

    // present value (total THD from Node-RED)
    const presentValueKey = `SAH_MTO_PQM1_Int THD-${channel}`;
    const THD = latestDoc[presentValueKey] || null;

    return {
      channel,
      THD,
      oddTHD,
      evenTHD,
      // odd,
      // even,
      // stats: {
      //   oddMin,
      //   oddMax,
      //   oddAvg,
      //   evenMin,
      //   evenMax,
      //   evenAvg,
      //   overallMin,
      //   overallMax,
      //   overallAvg,
      // },
    };
  }
}
