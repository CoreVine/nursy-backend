import { OrderStatus, TimeType, UserType } from "@prisma/client"

export const UserTypeList = [UserType.Patient, UserType.Custodian, UserType.Nurse] as const
export const OrderStatusList = Object.values(OrderStatus).filter((value) => typeof value === "string")
export const TimeTypeList = Object.values(TimeType).filter((value) => typeof value === "string")
