import { Module } from '@nestjs/common';

import { GatewayProvider } from './gateway.provider';

@Module({
  providers: [GatewayProvider],
  exports: [GatewayProvider],
})
export class GatewayModule {}
