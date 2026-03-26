import { Args, Int, Query, Resolver } from "@nestjs/graphql";
import { PrismaService } from "../prisma/prisma.service";
import { SeaportModel, SeaportPage } from "./seaport.model";

@Resolver(() => SeaportModel)
export class SeaportResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => SeaportPage)
  async seaports(
    @Args("page", { type: () => Int, defaultValue: 1 }) page: number,
    @Args("pageSize", { type: () => Int, defaultValue: 20 }) pageSize: number,
    @Args("search", { nullable: true }) search?: string,
  ): Promise<SeaportPage> {
    const where = search
      ? {
          OR: [
            { portName: { contains: search, mode: "insensitive" as const } },
            { locode: { contains: search, mode: "insensitive" as const } },
            { countryIso: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.seaport.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { portName: "asc" },
      }),
      this.prisma.seaport.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  @Query(() => SeaportModel, { nullable: true })
  async seaport(
    @Args("locode") locode: string,
  ): Promise<SeaportModel | null> {
    return this.prisma.seaport.findUnique({
      where: { locode },
    });
  }

  @Query(() => Int)
  async seaportCount(): Promise<number> {
    return this.prisma.seaport.count();
  }
}
