using System;
using System.Collections.Generic;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Domain.Entities
{
    public class Address : BaseEntity
    {
        public string ZipCode { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string? Complement { get; set; }
        public string Neighborhood { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
    }

    public class Customer : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? Phone { get; set; }
        public string? CellPhone { get; set; }
        public string? Email { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;

        public int? AddressId { get; set; }
        public virtual Address? Address { get; set; }

        public virtual ICollection<Bicycle> Bicycles { get; set; } = new List<Bicycle>();
        public virtual ICollection<WorkOrder> WorkOrders { get; set; } = new List<WorkOrder>();
        public virtual ICollection<Sale> Sales { get; set; } = new List<Sale>();
    }

    public class Bicycle : BaseEntity
    {
        public int CustomerId { get; set; }
        public virtual Customer Customer { get; set; } = null!;

        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? FrameSize { get; set; }
        public string? SerialNumber { get; set; }
        public BikeType BikeType { get; set; } = BikeType.MountainBike;
        public string? Notes { get; set; }

        public virtual ICollection<WorkOrder> WorkOrders { get; set; } = new List<WorkOrder>();
    }
}
