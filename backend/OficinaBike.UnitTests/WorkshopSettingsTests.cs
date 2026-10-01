using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;
using OficinaBike.Application.Services;
using OficinaBike.Domain.Entities;
using OficinaBike.Domain.Exceptions;
using OficinaBike.Infrastructure.Persistence;
using Xunit;

namespace OficinaBike.UnitTests
{
    public class WorkshopSettingsTests
    {
        private OficinaBikeDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<OficinaBikeDbContext>()
                .UseInMemoryDatabase(databaseName: $"OficinaBike_Test_{Guid.NewGuid():N}")
                .Options;

            return new OficinaBikeDbContext(options);
        }

        [Fact]
        public async Task CreateSettings_WhenNoSettingsExist_ShouldSucceed()
        {
            // Arrange
            var db = CreateInMemoryDbContext();
            var mockStorage = new Mock<ILogoStorageService>();
            var mockAudit = new Mock<IAuditService>();
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            var service = new WorkshopSettingsService(db, mockStorage.Object, mockAudit.Object, memoryCache);

            var request = new CreateWorkshopSettingsRequest
            {
                CompanyName = "Oficina das Magrelas",
                TradeName = "Magrelas Bike",
                CorporateName = "Magrelas Comércio e Reparos Ltda",
                CpfCnpj = "12.345.678/0001-90",
                Phone = "(35) 3521-1234",
                WhatsApp = "(35) 99876-5432",
                Email = "contato@magrelas.com.br",
                Street = "Rua dos Ciclistas",
                Number = "123",
                Neighborhood = "Centro",
                City = "Passos",
                State = "MG",
                ZipCode = "37900-000",
                FooterMessage = "Revisamos sua bike com carinho!"
            };

            // Act
            var result = await service.CreateSettingsAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Id > 0);
            Assert.Equal("Oficina das Magrelas", result.CompanyName);
            Assert.Equal("Magrelas Bike", result.TradeName);
            Assert.Equal("12345678000190", result.CpfCnpj); // Cleaned digits in DB
            Assert.Equal("12.345.678/0001-90", result.FormattedCpfCnpj); // Formatted output
            Assert.Equal("3535211234", result.Phone);
            Assert.Equal("(35) 3521-1234", result.FormattedPhone);
            Assert.NotNull(result.Address);
            Assert.Equal("Rua dos Ciclistas", result.Address.Street);
            Assert.Equal("Passos", result.Address.City);
            Assert.Equal("MG", result.Address.State);

            mockAudit.Verify(a => a.LogAsync(
                "WorkshopSettings",
                result.Id.ToString(),
                "Create",
                null,
                It.IsAny<object>(),
                default), Times.Once);
        }

        [Fact]
        public async Task CreateSettings_WhenSettingsAlreadyExist_ShouldThrowBusinessRuleException()
        {
            // Arrange
            var db = CreateInMemoryDbContext();
            db.WorkshopSettings.Add(new WorkshopSettings
            {
                CompanyName = "Existente",
                TradeName = "Existente Bike",
                CorporateName = "Existente Ltda"
            });
            await db.SaveChangesAsync();

            var mockStorage = new Mock<ILogoStorageService>();
            var mockAudit = new Mock<IAuditService>();
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            var service = new WorkshopSettingsService(db, mockStorage.Object, mockAudit.Object, memoryCache);

            var request = new CreateWorkshopSettingsRequest
            {
                CompanyName = "Nova Oficina",
                TradeName = "Nova Bike",
                CorporateName = "Nova Ltda"
            };

            // Act & Assert
            await Assert.ThrowsAsync<BusinessRuleException>(() => service.CreateSettingsAsync(request));
        }

        [Fact]
        public async Task UpdateSettings_ShouldUpdateFieldsAndInvalidateCache()
        {
            // Arrange
            var db = CreateInMemoryDbContext();
            var settings = new WorkshopSettings
            {
                CompanyName = "Nome Antigo",
                TradeName = "Fantasia Antiga",
                CorporateName = "Razão Antiga",
                Phone = "1111111111"
            };
            db.WorkshopSettings.Add(settings);
            await db.SaveChangesAsync();

            var mockStorage = new Mock<ILogoStorageService>();
            var mockAudit = new Mock<IAuditService>();
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            var service = new WorkshopSettingsService(db, mockStorage.Object, mockAudit.Object, memoryCache);

            var updateRequest = new UpdateWorkshopSettingsRequest
            {
                CompanyName = "Nome Novo",
                TradeName = "Fantasia Nova",
                CorporateName = "Razão Nova",
                Phone = "3535219999",
                Street = "Avenida Central",
                Number = "50",
                Neighborhood = "Jardim",
                City = "Passos",
                State = "MG",
                ZipCode = "37900-100",
                FooterMessage = "Novo rodapé"
            };

            // Act
            var result = await service.UpdateSettingsAsync(updateRequest);

            // Assert
            Assert.Equal("Nome Novo", result.CompanyName);
            Assert.Equal("Fantasia Nova", result.TradeName);
            Assert.Equal("3535219999", result.Phone);
            Assert.NotNull(result.Address);
            Assert.Equal("Avenida Central", result.Address.Street);
            Assert.Equal("Novo rodapé", result.FooterMessage);

            mockAudit.Verify(a => a.LogAsync(
                "WorkshopSettings",
                settings.Id.ToString(),
                "Update",
                It.IsAny<object>(),
                It.IsAny<object>(),
                default), Times.Once);
        }

        [Fact]
        public async Task UpdateLogo_ValidPng_ShouldSaveStorageAndAudit()
        {
            // Arrange
            var db = CreateInMemoryDbContext();
            var settings = new WorkshopSettings
            {
                CompanyName = "Bike Test",
                TradeName = "Bike Test",
                CorporateName = "Bike Test Ltda"
            };
            db.WorkshopSettings.Add(settings);
            await db.SaveChangesAsync();

            var mockStorage = new Mock<ILogoStorageService>();
            mockStorage.Setup(s => s.SaveLogoAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), default))
                .ReturnsAsync("/uploads/logos/logo_test.png");

            var mockAudit = new Mock<IAuditService>();
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            var service = new WorkshopSettingsService(db, mockStorage.Object, mockAudit.Object, memoryCache);

            // Valid PNG header bytes: 89 50 4E 47 0D 0A 1A 0A
            var validPngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
            using var stream = new MemoryStream(validPngBytes);

            // Act
            var response = await service.UpdateLogoAsync(stream, "logo.png", "image/png", validPngBytes.Length);

            // Assert
            Assert.NotNull(response);
            Assert.Equal("logo.png", response.FileName);
            Assert.Equal("image/png", response.ContentType);
            Assert.Equal("/api/workshop-settings/logo", response.LogoUrl);

            mockStorage.Verify(s => s.SaveLogoAsync(It.IsAny<Stream>(), "logo.png", "image/png", default), Times.Once);
            mockAudit.Verify(a => a.LogAsync(
                "WorkshopSettings",
                settings.Id.ToString(),
                "UpdateLogo",
                It.IsAny<object>(),
                It.IsAny<object>(),
                default), Times.Once);
        }

        [Fact]
        public async Task UpdateLogo_InvalidMagicBytes_ShouldThrowBusinessRuleException()
        {
            // Arrange
            var db = CreateInMemoryDbContext();
            var mockStorage = new Mock<ILogoStorageService>();
            var mockAudit = new Mock<IAuditService>();
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            var service = new WorkshopSettingsService(db, mockStorage.Object, mockAudit.Object, memoryCache);

            // Plain text disguised as PNG
            var fakeBytes = Encoding.UTF8.GetBytes("Not a real png image file content");
            using var stream = new MemoryStream(fakeBytes);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<BusinessRuleException>(() =>
                service.UpdateLogoAsync(stream, "fake.png", "image/png", fakeBytes.Length));

            Assert.Contains("não corresponde a uma imagem válida", ex.Message);
        }

        [Fact]
        public async Task DocumentCompanyInfoService_ShouldProvideFormattedHeader()
        {
            // Arrange
            var db = CreateInMemoryDbContext();
            var address = new Address
            {
                Street = "Rua Central",
                Number = "100",
                Neighborhood = "Centro",
                City = "Passos",
                State = "MG",
                ZipCode = "37900000"
            };
            db.Addresses.Add(address);
            await db.SaveChangesAsync();

            db.WorkshopSettings.Add(new WorkshopSettings
            {
                CompanyName = "Oficina Bike",
                TradeName = "Oficina Bike Pro",
                CorporateName = "Oficina Bike Pro Ltda",
                CpfCnpj = "12345678000190",
                Phone = "3535210000",
                AddressId = address.Id,
                Address = address,
                FooterMessage = "Obrigado!"
            });
            await db.SaveChangesAsync();

            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            var docService = new DocumentCompanyInfoService(db, memoryCache);

            // Act
            var header = await docService.GetCompanyHeaderAsync();

            // Assert
            Assert.NotNull(header);
            Assert.Equal("Oficina Bike Pro", header.Name);
            Assert.Equal("12.345.678/0001-90", header.FormattedCpfCnpj);
            Assert.Equal("(35) 3521-0000", header.FormattedPhone);
            Assert.NotNull(header.Address);
            Assert.Equal("Rua Central, 100 - Centro - Passos - MG - 37900-000", header.Address.FormattedAddressLine);
            Assert.Equal("Obrigado!", header.FooterMessage);
        }
    }
}
