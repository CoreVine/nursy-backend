import { Prisma } from "@prisma/client"

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

export async function paginate<TDelegate extends { findMany: any; count: any }, TArgs extends Prisma.Args<TDelegate, "findMany">>(model: TDelegate, args: TArgs & PaginationParams): Promise<PaginatedResult<Prisma.Result<TDelegate, TArgs, "findMany">>> {
  const { page = 1, pageSize = 10, ...rest } = args

  const skip = (page - 1) * pageSize
  const take = pageSize

  const { where } = rest as { where?: any }

  const total = await (model as any).count({ where })

  const data = await (model as any).findMany({
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
