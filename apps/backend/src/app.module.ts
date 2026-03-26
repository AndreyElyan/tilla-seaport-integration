import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { AppResolver } from "./app.resolver";
import { EtlModule } from "./etl/etl.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SeaportModule } from "./seaport/seaport.module";

@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: process.env.NODE_ENV !== "production",
      plugins: [],
    }),
    EtlModule,
    SeaportModule,
  ],
  providers: [AppResolver],
})
export class AppModule {}
