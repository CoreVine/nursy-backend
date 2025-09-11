export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationMeta
}

export class BaseModel<TDelegate extends { [k: string]: any }> {
  static model: any
  static hidden: string[] = []

  static async findById<T extends { findUnique: (args: any) => any }>(this: { model: T }, id: number, include: any = {}): Promise<Awaited<ReturnType<T["findUnique"]>>> {
    return this.model.findUnique({ where: { id }, include })
  }

  static async findMany<T extends { findMany: (args?: any) => any }, TArgs extends Parameters<T["findMany"]>[0]>(this: { model: T }, args?: TArgs): Promise<Awaited<ReturnType<T["findMany"]>>> {
    return this.model.findMany(args)
  }

  static async delete<T extends { delete: (args: any) => any }>(this: { model: T }, id: number): Promise<Awaited<ReturnType<T["delete"]>>> {
    return this.model.delete({ where: { id } })
  }

  static async create<T extends { create: (args: any) => any }, TArgs extends Parameters<T["create"]>[0]>(this: { model: T }, args: TArgs): Promise<Awaited<ReturnType<T["create"]>>> {
    return this.model.create(args)
  }

  static async count<T extends { count: (args?: any) => Promise<number> }, TArgs extends NonNullable<Parameters<T["count"]>[0]>["where"]>(this: { model: T }, where?: TArgs): Promise<number> {
    return this.model.count(where ? { where } : {})
  }
  static async update<T extends { update: (args: any) => any }, TData>(this: { model: T }, id: number, data: TData): Promise<Awaited<ReturnType<T["update"]>>> {
    return this.model.update({
      where: { id },
      data
    })
  }

  static async paginate<T extends { findMany: (args?: any) => any; count: (args?: any) => any }, TArgs extends Parameters<T["findMany"]>[0]>(this: { model: T }, args: TArgs & PaginationParams): Promise<PaginatedResult<Awaited<ReturnType<T["findMany"]>>[number]>> {
    const { page = 1, pageSize = 10, ...rest } = args
    const skip = (page - 1) * pageSize
    const take = pageSize

    const { where } = rest as { where?: any }

    const total = await (this.model as any).count({ where })

    const data = await (this.model as any).findMany({
      ...(rest as any),
      skip,
      take
    })

    const totalPages = Math.ceil(total / pageSize)

    return {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  }
}
