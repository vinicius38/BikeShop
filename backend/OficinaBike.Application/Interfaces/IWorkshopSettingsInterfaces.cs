using System.IO;
using System.Threading;
using System.Threading.Tasks;
using OficinaBike.Application.DTOs;

namespace OficinaBike.Application.Interfaces
{
    public interface IWorkshopSettingsService
    {
        Task<WorkshopSettingsResponse> GetSettingsAsync(CancellationToken cancellationToken = default);
        Task<WorkshopSettingsResponse> CreateSettingsAsync(CreateWorkshopSettingsRequest request, CancellationToken cancellationToken = default);
        Task<WorkshopSettingsResponse> UpdateSettingsAsync(UpdateWorkshopSettingsRequest request, CancellationToken cancellationToken = default);
        Task<WorkshopLogoResponse> UpdateLogoAsync(Stream fileStream, string fileName, string contentType, long fileLength, CancellationToken cancellationToken = default);
        Task DeleteLogoAsync(CancellationToken cancellationToken = default);
        Task<(Stream Stream, string ContentType, string FileName)?> GetLogoFileAsync(CancellationToken cancellationToken = default);
    }

    public interface IDocumentCompanyInfoService
    {
        Task<DocumentCompanyHeader> GetCompanyHeaderAsync(bool includeBase64Logo = false, CancellationToken cancellationToken = default);
    }

    public interface ILogoStorageService
    {
        Task<string> SaveLogoAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
        Task<(Stream Stream, string ContentType)?> GetLogoAsync(string storagePath, CancellationToken cancellationToken = default);
        Task DeleteLogoAsync(string storagePath, CancellationToken cancellationToken = default);
    }
}
