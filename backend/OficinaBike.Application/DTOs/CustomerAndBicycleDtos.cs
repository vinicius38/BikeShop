using System;
using System.Collections.Generic;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Application.DTOs
{
    public class AddressDto
    {
        public int Id { get; set; }
        public string ZipCode { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string? Complement { get; set; }
        public string Neighborhood { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
    }

    public class CustomerResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? Phone { get; set; }
        public string? CellPhone { get; set; }
        public string? Email { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public AddressDto? Address { get; set; }
        public int BicyclesCount { get; set; }
        public int WorkOrdersCount { get; set; }
        public int SalesCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateCustomerRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? Phone { get; set; }
        public string? CellPhone { get; set; }
        public string? Email { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? Notes { get; set; }
        public AddressDto? Address { get; set; }
    }

    public class UpdateCustomerRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? Phone { get; set; }
        public string? CellPhone { get; set; }
        public string? Email { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
        public AddressDto? Address { get; set; }
    }

    public class BicycleResponse
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? FrameSize { get; set; }
        public string? SerialNumber { get; set; }
        public BikeType BikeType { get; set; }
        public string BikeTypeName => BikeType.ToString();
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBicycleRequest
    {
        public int CustomerId { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? FrameSize { get; set; }
        public string? SerialNumber { get; set; }
        public BikeType BikeType { get; set; } = BikeType.MountainBike;
        public string? Notes { get; set; }
    }

    public class UpdateBicycleRequest
    {
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? FrameSize { get; set; }
        public string? SerialNumber { get; set; }
        public BikeType BikeType { get; set; }
        public string? Notes { get; set; }
    }
}
