using System;

namespace OficinaBike.Domain.Enums
{
    public enum UserRoleType
    {
        Administrador = 1,
        Gerente = 2,
        Atendente = 3,
        Mecanico = 4,
        Financeiro = 5
    }

    public enum BikeType
    {
        MountainBike = 1,
        Speed = 2,
        Urbana = 3,
        Eletrica = 4,
        Infantil = 5,
        Dobravel = 6,
        Outra = 7
    }

    public enum UnitOfMeasure
    {
        UN = 1,
        KG = 2,
        L = 3,
        MT = 4,
        PAR = 5,
        CX = 6
    }

    public enum ItemType
    {
        Product = 1,
        Service = 2
    }

    public enum WorkOrderStatus
    {
        Open = 1,
        WaitingApproval = 2,
        Approved = 3,
        InProgress = 4,
        WaitingParts = 5,
        Ready = 6,
        Delivered = 7,
        Cancelled = 8
    }

    public enum WorkOrderApprovalStatus
    {
        Pending = 1,
        Approved = 2,
        Rejected = 3
    }

    public enum SaleStatus
    {
        Open = 1,
        Completed = 2,
        Cancelled = 3
    }

    public enum StockMovementType
    {
        Purchase = 1,
        Sale = 2,
        WorkOrder = 3,
        Adjustment = 4,
        Return = 5,
        InitialStock = 6,
        Loss = 7,
        Cancellation = 8
    }
}
