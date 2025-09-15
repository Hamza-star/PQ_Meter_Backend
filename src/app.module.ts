import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from 'helpers/db/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MeterModule } from './meter/meter.module';
import { PQMeterModule } from './pq-meter/pq-meter.module';
import { PrivellegesModule } from './privelleges/privelleges.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');
        if (!uri) {
          throw new Error(
            'MongoDB URI not found. Please check your .env file.',
          );
        }
        console.log(
          'MongoDB URI loaded:',
          uri.includes('localhost') ? 'Local DB' : 'Atlas DB',
        );
        return { uri };
      },
    }),

    AuthModule,
    UsersModule,
    PrivellegesModule,
    RolesModule,
    MeterModule,
    PQMeterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
