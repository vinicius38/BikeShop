using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using OficinaBike.API.Authorization;
using OficinaBike.Application.Common;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;

namespace OficinaBike.API.Controllers
{
    [ApiController]
    [Route("api/workshop-settings")]
    public class WorkshopSettingsController : BaseApiController
    {
        private readonly IWorkshopSettingsService _settingsService;

        public WorkshopSettingsController(IWorkshopSettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        [RequirePermission("WorkshopSettings.View")]
        [ProducesResponseType(typeof(ApiResponse<WorkshopSettingsResponse>), 200)]
        public async Task<ActionResult<ApiResponse<WorkshopSettingsResponse>>> GetSettings(CancellationToken cancellationToken)
        {
            var result = await _settingsService.GetSettingsAsync(cancellationToken);
            return HandleOk(result, "Configurações da oficina obtidas com sucesso.");
        }

        [HttpPost]
        [RequirePermission("WorkshopSettings.Create")]
        [ProducesResponseType(typeof(ApiResponse<WorkshopSettingsResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkshopSettingsResponse>>> CreateSettings(
            [FromBody] CreateWorkshopSettingsRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _settingsService.CreateSettingsAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetSettings), ApiResponse<WorkshopSettingsResponse>.Ok(result, "Configurações cadastradas com sucesso."));
        }

        [HttpPut]
        [RequirePermission("WorkshopSettings.Update")]
        [ProducesResponseType(typeof(ApiResponse<WorkshopSettingsResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkshopSettingsResponse>>> UpdateSettings(
            [FromBody] UpdateWorkshopSettingsRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _settingsService.UpdateSettingsAsync(request, cancellationToken);
            return HandleOk(result, "Configurações da oficina atualizadas com sucesso.");
        }

        [HttpPost("logo")]
        [RequirePermission("WorkshopSettings.UpdateLogo")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(ApiResponse<WorkshopLogoResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkshopLogoResponse>>> UploadLogo(
            IFormFile file,
            CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<object>.Fail("Nenhum arquivo de logo foi enviado."));
            }

            using var stream = file.OpenReadStream();
            var result = await _settingsService.UpdateLogoAsync(
                stream,
                file.FileName,
                file.ContentType,
                file.Length,
                cancellationToken);

            return HandleOk(result, "Logo da oficina atualizada com sucesso.");
        }

        [HttpDelete("logo")]
        [RequirePermission("WorkshopSettings.DeleteLogo")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> DeleteLogo(CancellationToken cancellationToken)
        {
            await _settingsService.DeleteLogoAsync(cancellationToken);
            return NoContent();
        }

        [HttpGet("logo")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(FileStreamResult), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetLogo(CancellationToken cancellationToken)
        {
            var file = await _settingsService.GetLogoFileAsync(cancellationToken);
            if (file == null)
            {
                return NotFound();
            }

            return File(file.Value.Stream, file.Value.ContentType, file.Value.FileName);
        }
    }
}
