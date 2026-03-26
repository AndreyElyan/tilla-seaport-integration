import { Field, Int, Mutation, ObjectType, Resolver } from "@nestjs/graphql";
import type { SeaportSyncService } from "./services/seaport-sync.service";

@ObjectType()
class SyncError {
  @Field(() => Int)
  rowIndex!: number;

  @Field(() => [String])
  reasons!: string[];
}

@ObjectType()
class SyncResultType {
  @Field(() => Int)
  totalRows!: number;

  @Field(() => Int)
  validRows!: number;

  @Field(() => Int)
  invalidRows!: number;

  @Field(() => Int)
  upsertedRows!: number;

  @Field(() => [SyncError])
  errors!: SyncError[];

  @Field(() => Int)
  duration!: number;
}

@Resolver()
export class EtlResolver {
  constructor(private readonly syncService: SeaportSyncService) {}

  @Mutation(() => SyncResultType)
  async syncSeaports(): Promise<SyncResultType> {
    return this.syncService.sync();
  }
}
