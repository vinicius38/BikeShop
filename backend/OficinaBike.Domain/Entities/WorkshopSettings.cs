using System;

namespace OficinaBike.Domain.Entities
{
    public class WorkshopSettings : BaseEntity
    {
        public string CompanyName { get; set; } = string.Empty;
        public string TradeName { get; set; } = string.Empty;
        public string CorporateName { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? StateRegistration { get; set; }

        public string? Phone { get; set; }
        public string? WhatsApp { get; set; }
        public string? Email { get; set; }
        public string? Website { get; set; }

        public int? AddressId { get; set; }
        public virtual Address? Address { get; set; }

        public string? LogoFileName { get; set; }
        public string? LogoContentType { get; set; }
        public string? LogoStoragePath { get; set; }
        public byte[]? LogoData { get; set; }

        public string? FooterMessage { get; set; }
        public string? AdditionalInformation { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
