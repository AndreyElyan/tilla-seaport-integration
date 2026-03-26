import { Module } from "@nestjs/common";
import { SeaportResolver } from "./seaport.resolver";

@Module({
  providers: [SeaportResolver],
})
export class SeaportModule {}
