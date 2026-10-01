using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OficinaBike.Application.Interfaces;
using OficinaBike.Domain.Exceptions;

namespace OficinaBike.Infrastructure.Storage
{
    public class FileLogoStorageService : ILogoStorageService
    {
        private readonly string _storageFolder;
        private readonly ILogger<FileLogoStorageService> _logger;

        public FileLogoStorageService(IConfiguration configuration, ILogger<FileLogoStorageService> logger)
        {
            _logger = logger;
            var configuredPath = configuration["Storage:LogoPath"];
            if (!string.IsNullOrWhiteSpace(configuredPath))
            {
                _storageFolder = Path.IsPathRooted(configuredPath)
                    ? configuredPath
                    : Path.Combine(AppContext.BaseDirectory, configuredPath);
            }
            else
            {
                _storageFolder = Path.Combine(AppContext.BaseDirectory, "uploads", "logos");
            }

            if (!Directory.Exists(_storageFolder))
            {
                Directory.CreateDirectory(_storageFolder);
            }
        }

        public async Task<string> SaveLogoAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
        {
            try
            {
                var extension = Path.GetExtension(fileName).ToLowerInvariant();
                var safeUniqueName = $"logo_{Guid.NewGuid():N}{extension}";
                var destinationPath = Path.Combine(_storageFolder, safeUniqueName);

                using var destination = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true);
                if (stream.CanSeek)
                {
                    stream.Position = 0;
                }
                await stream.CopyToAsync(destination, ct);

                _logger.LogInformation("Logo salvo com sucesso no caminho: {DestinationPath}", destinationPath);
                return destinationPath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao salvar arquivo de logo no disco.");
                throw new BusinessRuleException("Falha ao salvar a imagem da logo no armazenamento.");
            }
        }

        public Task<(Stream Stream, string ContentType)?> GetLogoAsync(string storagePath, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(storagePath) || !File.Exists(storagePath))
            {
                return Task.FromResult<(Stream Stream, string ContentType)?>(null);
            }

            try
            {
                var stream = new FileStream(storagePath, FileMode.Open, FileAccess.Read, FileShare.Read);
                var extension = Path.GetExtension(storagePath).ToLowerInvariant();
                var contentType = extension switch
                {
                    ".png" => "image/png",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".webp" => "image/webp",
                    _ => "application/octet-stream"
                };

                return Task.FromResult<(Stream Stream, string ContentType)?>((stream, contentType));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao carregar o arquivo da logo do caminho {StoragePath}", storagePath);
                return Task.FromResult<(Stream Stream, string ContentType)?>(null);
            }
        }

        public Task DeleteLogoAsync(string storagePath, CancellationToken ct = default)
        {
            if (!string.IsNullOrWhiteSpace(storagePath) && File.Exists(storagePath))
            {
                try
                {
                    File.Delete(storagePath);
                    _logger.LogInformation("Arquivo de logo removido com sucesso: {StoragePath}", storagePath);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Não foi possível remover fisicamente o arquivo anterior de logo: {StoragePath}", storagePath);
                }
            }
            return Task.CompletedTask;
        }
    }
}
