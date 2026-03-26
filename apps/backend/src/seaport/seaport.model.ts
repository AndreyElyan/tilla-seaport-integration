import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SeaportModel {
  @Field(() => Int)
  id!: number;

  @Field()
  portName!: string;

  @Field()
  locode!: string;

  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;

  @Field(() => String, { nullable: true })
  timezoneOlson!: string | null;

  @Field(() => String, { nullable: true })
  countryIso!: string | null;

  @Field()
  clientSource!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class SeaportPage {
  @Field(() => [SeaportModel])
  items!: SeaportModel[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  pageSize!: number;

  @Field(() => Int)
  totalPages!: number;
}
