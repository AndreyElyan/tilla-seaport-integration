import { Args, Int, Query, Resolver, registerEnumType } from "@nestjs/graphql";
import { PrismaService } from "../prisma/prisma.service";
import { SeaportModel, SeaportPage } from "./seaport.model";

enum SeaportSortField {
  portName = "portName",
  locode = "locode",
  countryIso = "countryIso",
  latitude = "latitude",
  longitude = "longitude",
  updatedAt = "updatedAt",
}

enum SortDirection {
  asc = "asc",
  desc = "desc",
}

registerEnumType(SeaportSortField, { name: "SeaportSortField" });
registerEnumType(SortDirection, { name: "SortDirection" });

@Resolver(() => SeaportModel)
export class SeaportResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => SeaportPage)
  async seaports(
    @Args("page", { type: () => Int, defaultValue: 1 }) page: number,
    @Args("pageSize", { type: () => Int, defaultValue: 20 }) pageSize: number,
    @Args("search", { nullable: true }) search?: string,
    @Args("countryIso", { nullable: true }) countryIso?: string,
    @Args("sortBy", {
      type: () => SeaportSortField,
      nullable: true,
      defaultValue: SeaportSortField.portName,
    })
    sortBy?: SeaportSortField,
    @Args("sortDirection", {
      type: () => SortDirection,
      nullable: true,
      defaultValue: SortDirection.asc,
    })
    sortDirection?: SortDirection,
  ): Promise<SeaportPage> {
    const conditions: Record<string, unknown>[] = [];

    if (search) {
      conditions.push({
        OR: [
          { portName: { contains: search, mode: "insensitive" as const } },
          { locode: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (countryIso) {
      conditions.push({
        countryIso: { equals: countryIso.toUpperCase() },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [items, total] = await Promise.all([
      this.prisma.seaport.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy ?? "portName"]: sortDirection ?? "asc" },
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
  async seaport(@Args("locode") locode: string): Promise<SeaportModel | null> {
    return this.prisma.seaport.findUnique({
      where: { locode },
    });
  }

  @Query(() => Int)
  async seaportCount(): Promise<number> {
    return this.prisma.seaport.count();
  }
}
