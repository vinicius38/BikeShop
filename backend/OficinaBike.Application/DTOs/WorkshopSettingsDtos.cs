using System;
using System.Text.RegularExpressions;

namespace OficinaBike.Application.DTOs
{
    public class WorkshopSettingsResponse
    {
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string TradeName { get; set; } = string.Empty;
        public string CorporateName { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? FormattedCpfCnpj => Formatters.FormatCpfCnpj(CpfCnpj);
        public string? StateRegistration { get; set; }

        public string? Phone { get; set; }
        public string? FormattedPhone => Formatters.FormatPhone(Phone);
        public string? WhatsApp { get; set; }
        public string? FormattedWhatsApp => Formatters.FormatPhone(WhatsApp);
        public string? Email { get; set; }
        public string? Website { get; set; }

        public CompanyAddressDto? Address { get; set; }

        public bool HasLogo { get; set; }
        public string? LogoFileName { get; set; }
        public string? LogoContentType { get; set; }
        public string LogoUrl => HasLogo ? "/api/workshop-settings/logo" : string.Empty;

        public string? FooterMessage { get; set; }
        public string? AdditionalInformation { get; set; }

        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateWorkshopSettingsRequest
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

        // Address fields
        public string? ZipCode { get; set; }
        public string? Street { get; set; }
        public string? Number { get; set; }
        public string? Complement { get; set; }
        public string? Neighborhood { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }

        public string? FooterMessage { get; set; }
        public string? AdditionalInformation { get; set; }
    }

    public class UpdateWorkshopSettingsRequest
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

        // Address fields
        public string? ZipCode { get; set; }
        public string? Street { get; set; }
        public string? Number { get; set; }
        public string? Complement { get; set; }
        public string? Neighborhood { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }

        public string? FooterMessage { get; set; }
        public string? AdditionalInformation { get; set; }
    }

    public class WorkshopLogoResponse
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string LogoUrl { get; set; } = "/api/workshop-settings/logo";
        public DateTime UploadedAt { get; set; }
    }

    public class DocumentCompanyHeader
    {
        public string Name => !string.IsNullOrWhiteSpace(TradeName) ? TradeName : CompanyName;
        public string CompanyName { get; set; } = string.Empty;
        public string TradeName { get; set; } = string.Empty;
        public string CorporateName { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? FormattedCpfCnpj => Formatters.FormatCpfCnpj(CpfCnpj);
        public string? StateRegistration { get; set; }

        public string? Phone { get; set; }
        public string? FormattedPhone => Formatters.FormatPhone(Phone);
        public string? WhatsApp { get; set; }
        public string? FormattedWhatsApp => Formatters.FormatPhone(WhatsApp);
        public string? Email { get; set; }
        public string? Website { get; set; }

        public CompanyAddressDto? Address { get; set; }

        public string? LogoUrl { get; set; }
        public string? LogoBase64 { get; set; }

        public string? FooterMessage { get; set; }
        public string? AdditionalInformation { get; set; }
    }

    public class CompanyAddressDto
    {
        public string Street { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string? Complement { get; set; }
        public string Neighborhood { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string FormattedZipCode => Formatters.FormatZipCode(ZipCode);

        public string FormattedAddressLine
        {
            get
            {
                var comp = !string.IsNullOrWhiteSpace(Complement) ? $", {Complement}" : "";
                var parts = new[]
                {
                    $"{Street}, {Number}{comp}",
                    Neighborhood,
                    $"{City} - {State}",
                    FormattedZipCode
                };
                return string.Join(" - ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
            }
        }
    }

    public static class Formatters
    {
        public static string? FormatCpfCnpj(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var clean = Regex.Replace(value, @"\D", "");
            if (clean.Length == 11)
            {
                return Convert.ToUInt64(clean).ToString(@"000\.000\.000\-00");
            }
            if (clean.Length == 14)
            {
                return Convert.ToUInt64(clean).ToString(@"00\.000\.000\/0000\-00");
            }
            return value;
        }

        public static string? FormatPhone(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var clean = Regex.Replace(value, @"\D", "");
            if (clean.Length == 11)
            {
                return $"({clean[..2]}) {clean[2..7]}-{clean[7..]}";
            }
            if (clean.Length == 10)
            {
                return $"({clean[..2]}) {clean[2..6]}-{clean[6..]}";
            }
            return value;
        }

        public static string FormatZipCode(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            var clean = Regex.Replace(value, @"\D", "");
            if (clean.Length == 8)
            {
                return $"{clean[..5]}-{clean[5..]}";
            }
            return value;
        }

        public static string CleanDigits(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            return Regex.Replace(value, @"\D", "");
        }
    }
}
