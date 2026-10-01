using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OficinaBike.Application.Interfaces;

namespace OficinaBike.API.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? UserId
        {
            get
            {
                var subClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier) ??
                               _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");

                if (int.TryParse(subClaim, out var id))
                    return id;

                return null;
            }
        }

        public string? Username =>
            _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Name) ??
            _httpContextAccessor.HttpContext?.User?.FindFirstValue("unique_name");

        public string? Role =>
            _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);

        public string? IpAddress =>
            _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
    }
}
