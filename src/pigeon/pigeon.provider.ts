import Aedes, { createBroker } from 'aedes';
import { createServer } from 'aedes-server-factory';
import * as tls from 'tls';

import { Logger, Provider } from '@nestjs/common';

import { Transport } from './enum/pigeon.transport.enum';
import {
  INSTANCE_BROKER,
  LOGGER_KEY,
  PIGEON_OPTION_PROVIDER,
} from './pigeon.constant';
import { PigeonModuleOptions } from './pigeon.interface';

/**
 * Creates a provider function that generates a Pigeon MQTT broker instance based on the provided options.
 * @returns A provider configuration object for the Pigeon MQTT broker.
 */
export function createClientProvider(): Provider {
  return {
    provide: INSTANCE_BROKER,
    useFactory: async (options: PigeonModuleOptions) => {
      // Log that a broker instance is being created
      Logger.log('Creating Broker Instance', LOGGER_KEY);
      if (!options.transport) {
        Logger.log('Setting Default Transport For Mqtt < TCP >', LOGGER_KEY);
        options.transport = Transport.TCP;
      }
      // Create a new instance of Aedes broker using the options passed in
      const broker: Aedes = createBroker(options);
      // If a port is provided in the options, create a server using the broker and listen on that port
      if (options.transport == Transport.TCP) {
        const secureServer = tls
          .createServer(
            {
              key: options.key,
              cert: options.cert,
              ca: options.ca,
              rejectUnauthorized: options.rejectUnauthorized,
              requestCert: options.requestCert,
            },
            broker.handle,
          )
          .listen(options.port);

        secureServer.on('secureConnection', (socket) => {
          if (!socket.authorized) {
            Logger.error('Unauthorized Connection', LOGGER_KEY);
            return;
          }
          const cert = socket.getPeerCertificate();
          broker.emit('secureConnection', {
            cn: cert.subject.CN,
            ou: cert.subject.OU,
            o: cert.subject.O,
          });
        });
        Logger.log(
          `Creating TCP Server on Port ${options.port}...`,
          LOGGER_KEY,
        );
      }

      // If a WebSocket port is provided in the options, create a server using the broker with WebSocket enabled and listen on that port
      if (options.transport == Transport.WS) {
        createServer(broker, { ws: true }).listen(options.port);
        Logger.log(`Creating WS Server on Port ${options.port}...`, LOGGER_KEY);
      }

      // Return the created broker instance and certificate details
      return broker;
    },
    // Inject the Pigeon module options into the function
    inject: [PIGEON_OPTION_PROVIDER],
  };
}
