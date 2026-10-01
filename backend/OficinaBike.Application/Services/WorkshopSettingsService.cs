using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;
using OficinaBike.Domain.Entities;
using OficinaBike.Domain.Exceptions;

namespace OficinaBike.Application.Services
{
    public class WorkshopSettingsService : IWorkshopSettingsService
    {
        private const string CacheKey = "WorkshopCompanyHeader";
        private readonly IOficinaBikeDbContext _context;
        private readonly ILogoStorageService _logoStorageService;
        private readonly IAuditService _auditService;
        private readonly IMemoryCache _cache;

        public WorkshopSettingsService(
            IOficinaBikeDbContext context,
            ILogoStorageService logoStorageService,
            IAuditService auditService,
            IMemoryCache cache)
        {
            _context = context;
            _logoStorageService = logoStorageService;
            _auditService = auditService;
            _cache = cache;
        }

        public async Task<WorkshopSettingsResponse> GetSettingsAsync(CancellationToken cancellationToken = default)
        {
            var settings = await GetCurrentSettingsEntityAsync(cancellationToken);
            if (settings == null)
            {
                // Return default unconfigured response so clients can display form or defaults
                return new WorkshopSettingsResponse
                {
                    Id = 0,
                    CompanyName = "Oficina de Bicicletas",
                    TradeName = "Oficina Bike",
                    CorporateName = "Oficina de Bicicletas Ltda",
                    FooterMessage = "Obrigado pela preferência! Volte sempre.",
                    IsActive = true
                };
            }

            return MapToResponse(settings);
        }

        public async Task<WorkshopSettingsResponse> CreateSettingsAsync(CreateWorkshopSettingsRequest request, CancellationToken cancellationToken = default)
        {
            var existing = await _context.WorkshopSettings.FirstOrDefaultAsync(cancellationToken);
            if (existing != null)
            {
                throw new BusinessRuleException("A oficina já possui configurações cadastradas. Utilize a atualização (PUT).");
            }

            var cleanCpfCnpj = Formatters.CleanDigits(request.CpfCnpj);
            var cleanPhone = Formatters.CleanDigits(request.Phone);
            var cleanWhatsApp = Formatters.CleanDigits(request.WhatsApp);
            var cleanZip = Formatters.CleanDigits(request.ZipCode);

            Address? address = null;
            if (!string.IsNullOrWhiteSpace(request.Street) || !string.IsNullOrWhiteSpace(request.City))
            {
                address = new Address
                {
                    Street = request.Street?.Trim() ?? string.Empty,
                    Number = request.Number?.Trim() ?? string.Empty,
                    Complement = request.Complement?.Trim(),
                    Neighborhood = request.Neighborhood?.Trim() ?? string.Empty,
                    City = request.City?.Trim() ?? string.Empty,
                    State = request.State?.Trim().ToUpperInvariant() ?? string.Empty,
                    ZipCode = cleanZip
                };
                _context.Addresses.Add(address);
                await _context.SaveChangesAsync(cancellationToken);
            }

            var settings = new WorkshopSettings
            {
                CompanyName = request.CompanyName.Trim(),
                TradeName = request.TradeName.Trim(),
                CorporateName = request.CorporateName.Trim(),
                CpfCnpj = string.IsNullOrWhiteSpace(cleanCpfCnpj) ? null : cleanCpfCnpj,
                StateRegistration = request.StateRegistration?.Trim(),
                Phone = string.IsNullOrWhiteSpace(cleanPhone) ? null : cleanPhone,
                WhatsApp = string.IsNullOrWhiteSpace(cleanWhatsApp) ? null : cleanWhatsApp,
                Email = request.Email?.Trim().ToLowerInvariant(),
                Website = request.Website?.Trim(),
                AddressId = address?.Id,
                Address = address,
                FooterMessage = request.FooterMessage?.Trim() ?? "Obrigado pela preferência! Volte sempre.",
                AdditionalInformation = request.AdditionalInformation?.Trim(),
                IsActive = true
            };

            _context.WorkshopSettings.Add(settings);
            await _context.SaveChangesAsync(cancellationToken);

            _cache.Remove(CacheKey);

            await _auditService.LogAsync(
                "WorkshopSettings",
                settings.Id.ToString(),
                "Create",
                null,
                new { settings.CompanyName, settings.CpfCnpj, settings.Email, settings.Phone },
                cancellationToken);

            return MapToResponse(settings);
        }

        public async Task<WorkshopSettingsResponse> UpdateSettingsAsync(UpdateWorkshopSettingsRequest request, CancellationToken cancellationToken = default)
        {
            var settings = await _context.WorkshopSettings
                .Include(w => w.Address)
                .FirstOrDefaultAsync(cancellationToken);

            var isNew = false;
            object? oldValues = null;

            if (settings == null)
            {
                isNew = true;
                settings = new WorkshopSettings();
                _context.WorkshopSettings.Add(settings);
            }
            else
            {
                oldValues = new
                {
                    settings.CompanyName,
                    settings.TradeName,
                    settings.CorporateName,
                    settings.CpfCnpj,
                    settings.Phone,
                    settings.WhatsApp,
                    settings.Email,
                    settings.FooterMessage
                };
            }

            var cleanCpfCnpj = Formatters.CleanDigits(request.CpfCnpj);
            var cleanPhone = Formatters.CleanDigits(request.Phone);
            var cleanWhatsApp = Formatters.CleanDigits(request.WhatsApp);
            var cleanZip = Formatters.CleanDigits(request.ZipCode);

            // Update or Create Address
            if (!string.IsNullOrWhiteSpace(request.Street) || !string.IsNullOrWhiteSpace(request.City))
            {
                if (settings.Address == null)
                {
                    var newAddress = new Address
                    {
                        Street = request.Street?.Trim() ?? string.Empty,
                        Number = request.Number?.Trim() ?? string.Empty,
                        Complement = request.Complement?.Trim(),
                        Neighborhood = request.Neighborhood?.Trim() ?? string.Empty,
                        City = request.City?.Trim() ?? string.Empty,
                        State = request.State?.Trim().ToUpperInvariant() ?? string.Empty,
                        ZipCode = cleanZip
                    };
                    _context.Addresses.Add(newAddress);
                    await _context.SaveChangesAsync(cancellationToken);
                    settings.AddressId = newAddress.Id;
                    settings.Address = newAddress;
                }
                else
                {
                    settings.Address.Street = request.Street?.Trim() ?? string.Empty;
                    settings.Address.Number = request.Number?.Trim() ?? string.Empty;
                    settings.Address.Complement = request.Complement?.Trim();
                    settings.Address.Neighborhood = request.Neighborhood?.Trim() ?? string.Empty;
                    settings.Address.City = request.City?.Trim() ?? string.Empty;
                    settings.Address.State = request.State?.Trim().ToUpperInvariant() ?? string.Empty;
                    settings.Address.ZipCode = cleanZip;
                    settings.Address.UpdatedAt = DateTime.UtcNow;
                }
            }

            settings.CompanyName = request.CompanyName.Trim();
            settings.TradeName = request.TradeName.Trim();
            settings.CorporateName = request.CorporateName.Trim();
            settings.CpfCnpj = string.IsNullOrWhiteSpace(cleanCpfCnpj) ? null : cleanCpfCnpj;
            settings.StateRegistration = request.StateRegistration?.Trim();
            settings.Phone = string.IsNullOrWhiteSpace(cleanPhone) ? null : cleanPhone;
            settings.WhatsApp = string.IsNullOrWhiteSpace(cleanWhatsApp) ? null : cleanWhatsApp;
            settings.Email = request.Email?.Trim().ToLowerInvariant();
            settings.Website = request.Website?.Trim();
            settings.FooterMessage = request.FooterMessage?.Trim();
            settings.AdditionalInformation = request.AdditionalInformation?.Trim();
            settings.IsActive = true;
            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _cache.Remove(CacheKey);

            var newValues = new
            {
                settings.CompanyName,
                settings.TradeName,
                settings.CorporateName,
                settings.CpfCnpj,
                settings.Phone,
                settings.WhatsApp,
                settings.Email,
                settings.FooterMessage
            };

            await _auditService.LogAsync(
                "WorkshopSettings",
                settings.Id.ToString(),
                isNew ? "Create" : "Update",
                oldValues,
                newValues,
                cancellationToken);

            return MapToResponse(settings);
        }

        public async Task<WorkshopLogoResponse> UpdateLogoAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            long fileLength,
            CancellationToken cancellationToken = default)
        {
            var (isValid, errorMessage) = Validators.LogoFileValidator.Validate(fileStream, fileName, contentType, fileLength);
            if (!isValid)
            {
                throw new BusinessRuleException(errorMessage ?? "Arquivo de logo inválido.");
            }

            var settings = await GetOrCreateSettingsEntityAsync(cancellationToken);

            // Read byte array for direct binary storage backup
            byte[] rawBytes;
            using (var memoryStream = new MemoryStream())
            {
                if (fileStream.CanSeek) fileStream.Position = 0;
                await fileStream.CopyToAsync(memoryStream, cancellationToken);
                rawBytes = memoryStream.ToArray();
            }

            // Remove previous file if exists
            if (!string.IsNullOrWhiteSpace(settings.LogoStoragePath))
            {
                await _logoStorageService.DeleteLogoAsync(settings.LogoStoragePath, cancellationToken);
            }

            // Save to physical storage
            using var uploadStream = new MemoryStream(rawBytes);
            var storagePath = await _logoStorageService.SaveLogoAsync(uploadStream, fileName, contentType, cancellationToken);

            var oldLogoInfo = new { settings.LogoFileName, settings.LogoContentType };

            settings.LogoFileName = Path.GetFileName(fileName);
            settings.LogoContentType = contentType.ToLowerInvariant();
            settings.LogoStoragePath = storagePath;
            settings.LogoData = rawBytes;
            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _cache.Remove(CacheKey);

            await _auditService.LogAsync(
                "WorkshopSettings",
                settings.Id.ToString(),
                "UpdateLogo",
                oldLogoInfo,
                new { settings.LogoFileName, settings.LogoContentType, FileLength = fileLength },
                cancellationToken);

            return new WorkshopLogoResponse
            {
                FileName = settings.LogoFileName,
                ContentType = settings.LogoContentType,
                FileSizeBytes = fileLength,
                LogoUrl = "/api/workshop-settings/logo",
                UploadedAt = settings.UpdatedAt ?? DateTime.UtcNow
            };
        }

        public async Task DeleteLogoAsync(CancellationToken cancellationToken = default)
        {
            var settings = await _context.WorkshopSettings.FirstOrDefaultAsync(cancellationToken);
            if (settings == null || (string.IsNullOrWhiteSpace(settings.LogoStoragePath) && settings.LogoData == null))
            {
                return;
            }

            var oldLogoInfo = new { settings.LogoFileName, settings.LogoContentType, settings.LogoStoragePath };

            if (!string.IsNullOrWhiteSpace(settings.LogoStoragePath))
            {
                await _logoStorageService.DeleteLogoAsync(settings.LogoStoragePath, cancellationToken);
            }

            settings.LogoFileName = null;
            settings.LogoContentType = null;
            settings.LogoStoragePath = null;
            settings.LogoData = null;
            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _cache.Remove(CacheKey);

            await _auditService.LogAsync(
                "WorkshopSettings",
                settings.Id.ToString(),
                "DeleteLogo",
                oldLogoInfo,
                null,
                cancellationToken);
        }

        public async Task<(Stream Stream, string ContentType, string FileName)?> GetLogoFileAsync(CancellationToken cancellationToken = default)
        {
            var settings = await _context.WorkshopSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
            if (settings == null)
            {
                return null;
            }

            // 1. Try file storage first
            if (!string.IsNullOrWhiteSpace(settings.LogoStoragePath))
            {
                var fileResult = await _logoStorageService.GetLogoAsync(settings.LogoStoragePath, cancellationToken);
                if (fileResult.HasValue)
                {
                    return (fileResult.Value.Stream, fileResult.Value.ContentType, settings.LogoFileName ?? "logo");
                }
            }

            // 2. Fallback to database binary data
            if (settings.LogoData != null && settings.LogoData.Length > 0)
            {
                var stream = new MemoryStream(settings.LogoData);
                var contentType = settings.LogoContentType ?? "image/png";
                return (stream, contentType, settings.LogoFileName ?? "logo");
            }

            return null;
        }

        private async Task<WorkshopSettings?> GetCurrentSettingsEntityAsync(CancellationToken cancellationToken)
        {
            return await _context.WorkshopSettings
                .Include(w => w.Address)
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);
        }

        private async Task<WorkshopSettings> GetOrCreateSettingsEntityAsync(CancellationToken cancellationToken)
        {
            var settings = await _context.WorkshopSettings
                .Include(w => w.Address)
                .FirstOrDefaultAsync(cancellationToken);

            if (settings == null)
            {
                settings = new WorkshopSettings
                {
                    CompanyName = "Oficina de Bicicletas",
                    TradeName = "Oficina Bike",
                    CorporateName = "Oficina de Bicicletas Ltda",
                    FooterMessage = "Obrigado pela preferência! Volte sempre.",
                    IsActive = true
                };
                _context.WorkshopSettings.Add(settings);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return settings;
        }

        private static WorkshopSettingsResponse MapToResponse(WorkshopSettings entity)
        {
            return new WorkshopSettingsResponse
            {
                Id = entity.Id,
                CompanyName = entity.CompanyName,
                TradeName = entity.TradeName,
                CorporateName = entity.CorporateName,
                CpfCnpj = entity.CpfCnpj,
                StateRegistration = entity.StateRegistration,
                Phone = entity.Phone,
                WhatsApp = entity.WhatsApp,
                Email = entity.Email,
                Website = entity.Website,
                Address = entity.Address != null ? new CompanyAddressDto
                {
                    Street = entity.Address.Street,
                    Number = entity.Address.Number,
                    Complement = entity.Address.Complement,
                    Neighborhood = entity.Address.Neighborhood,
                    City = entity.Address.City,
                    State = entity.Address.State,
                    ZipCode = entity.Address.ZipCode
                } : null,
                HasLogo = !string.IsNullOrWhiteSpace(entity.LogoStoragePath) || (entity.LogoData != null && entity.LogoData.Length > 0),
                LogoFileName = entity.LogoFileName,
                LogoContentType = entity.LogoContentType,
                FooterMessage = entity.FooterMessage,
                AdditionalInformation = entity.AdditionalInformation,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }

    public class DocumentCompanyInfoService : IDocumentCompanyInfoService
    {
        private const string CacheKey = "WorkshopCompanyHeader";
        private readonly IOficinaBikeDbContext _context;
        private readonly IMemoryCache _cache;

        public DocumentCompanyInfoService(IOficinaBikeDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<DocumentCompanyHeader> GetCompanyHeaderAsync(bool includeBase64Logo = false, CancellationToken cancellationToken = default)
        {
            // Use cache for the base header
            if (!_cache.TryGetValue(CacheKey, out DocumentCompanyHeader? header) || header == null)
            {
                var settings = await _context.WorkshopSettings
                    .Include(w => w.Address)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(cancellationToken);

                if (settings == null)
                {
                    header = new DocumentCompanyHeader
                    {
                        CompanyName = "Oficina Bike",
                        TradeName = "Oficina Bike",
                        CorporateName = "Oficina Bike Gerenciamento Ltda",
                        FooterMessage = "Obrigado pela preferência!"
                    };
                }
                else
                {
                    var hasLogo = !string.IsNullOrWhiteSpace(settings.LogoStoragePath) || (settings.LogoData != null && settings.LogoData.Length > 0);
                    header = new DocumentCompanyHeader
                    {
                        CompanyName = settings.CompanyName,
                        TradeName = settings.TradeName,
                        CorporateName = settings.CorporateName,
                        CpfCnpj = settings.CpfCnpj,
                        StateRegistration = settings.StateRegistration,
                        Phone = settings.Phone,
                        WhatsApp = settings.WhatsApp,
                        Email = settings.Email,
                        Website = settings.Website,
                        Address = settings.Address != null ? new CompanyAddressDto
                        {
                            Street = settings.Address.Street,
                            Number = settings.Address.Number,
                            Complement = settings.Address.Complement,
                            Neighborhood = settings.Address.Neighborhood,
                            City = settings.Address.City,
                            State = settings.Address.State,
                            ZipCode = settings.Address.ZipCode
                        } : null,
                        LogoUrl = hasLogo ? "/api/workshop-settings/logo" : null,
                        FooterMessage = settings.FooterMessage,
                        AdditionalInformation = settings.AdditionalInformation
                    };
                }

                _cache.Set(CacheKey, header, TimeSpan.FromMinutes(30));
            }

            // Clone or enrich with Base64 logo if requested
            if (includeBase64Logo && string.IsNullOrWhiteSpace(header.LogoBase64))
            {
                var settings = await _context.WorkshopSettings
                    .AsNoTracking()
                    .Select(w => new { w.LogoData, w.LogoContentType })
                    .FirstOrDefaultAsync(cancellationToken);

                if (settings?.LogoData != null && settings.LogoData.Length > 0)
                {
                    var mime = settings.LogoContentType ?? "image/png";
                    var base64 = Convert.ToBase64String(settings.LogoData);
                    header.LogoBase64 = $"data:{mime};base64,{base64}";
                }
            }

            return header;
        }
    }
}
