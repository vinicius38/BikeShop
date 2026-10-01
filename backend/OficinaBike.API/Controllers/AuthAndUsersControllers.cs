using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OficinaBike.Application.Common;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace OficinaBike.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        protected ActionResult<ApiResponse<T>> HandleOk<T>(T data, string? message = null)
        {
            return Ok(ApiResponse<T>.Ok(data, message));
        }
    }

    public class AuthController : BaseApiController
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
        {
            var result = await _authService.LoginAsync(request, cancellationToken);
            return HandleOk(result, "Autenticação realizada com sucesso.");
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
        {
            var result = await _authService.RefreshTokenAsync(request, cancellationToken);
            return HandleOk(result, "Token renovado com sucesso.");
        }

        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<ActionResult<ApiResponse<string>>> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
        {
            await _authService.ChangePasswordAsync(request, cancellationToken);
            return HandleOk("Senha alterada com sucesso.");
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<UserResponse>), 200)]
        public async Task<ActionResult<ApiResponse<UserResponse>>> GetCurrentUser(CancellationToken cancellationToken)
        {
            var user = await _authService.GetCurrentUserAsync(cancellationToken);
            return HandleOk(user);
        }
    }

    [Authorize]
    public class UsersController : BaseApiController
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Policy = "Users.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<UserResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<UserResponse>>>> GetUsers([FromQuery] PagedRequest request, CancellationToken cancellationToken)
        {
            var result = await _userService.GetUsersAsync(request, cancellationToken);
            return HandleOk(result);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = "Users.View")]
        [ProducesResponseType(typeof(ApiResponse<UserResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<UserResponse>>> GetById(int id, CancellationToken cancellationToken)
        {
            var user = await _userService.GetByIdAsync(id, cancellationToken);
            return HandleOk(user);
        }

        [HttpPost]
        [Authorize(Policy = "Users.Create")]
        [ProducesResponseType(typeof(ApiResponse<UserResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<UserResponse>>> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
        {
            var user = await _userService.CreateAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<UserResponse>.Ok(user, "Usuário cadastrado com sucesso."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "Users.Update")]
        [ProducesResponseType(typeof(ApiResponse<UserResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<UserResponse>>> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
        {
            var user = await _userService.UpdateAsync(id, request, cancellationToken);
            return HandleOk(user, "Usuário atualizado com sucesso.");
        }

        [HttpPatch("{id:int}/activate")]
        [Authorize(Policy = "Users.Update")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<ActionResult<ApiResponse<string>>> Activate(int id, CancellationToken cancellationToken)
        {
            await _userService.SetActiveStatusAsync(id, true, cancellationToken);
            return HandleOk("Usuário ativado com sucesso.");
        }

        [HttpPatch("{id:int}/deactivate")]
        [Authorize(Policy = "Users.Update")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<ActionResult<ApiResponse<string>>> Deactivate(int id, CancellationToken cancellationToken)
        {
            await _userService.SetActiveStatusAsync(id, false, cancellationToken);
            return HandleOk("Usuário desativado com sucesso.");
        }

        [HttpGet("roles")]
        [Authorize(Policy = "Users.View")]
        [ProducesResponseType(typeof(ApiResponse<System.Collections.Generic.List<RoleResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<System.Collections.Generic.List<RoleResponse>>>> GetRoles(CancellationToken cancellationToken)
        {
            var roles = await _userService.GetRolesAsync(cancellationToken);
            return HandleOk(roles);
        }

        [HttpPut("roles/{id:int}/permissions")]
        [Authorize(Policy = "Users.Update")]
        [ProducesResponseType(typeof(ApiResponse<RoleResponse>), 200)]
        public async Task<ActionResult<ApiResponse<RoleResponse>>> UpdateRolePermissions(int id, [FromBody] UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
        {
            var result = await _userService.UpdateRolePermissionsAsync(id, request, cancellationToken);
            return HandleOk(result, "Permissões atualizadas com sucesso.");
        }

        [HttpGet("permissions")]
        [Authorize(Policy = "Users.View")]
        [ProducesResponseType(typeof(ApiResponse<System.Collections.Generic.List<PermissionResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<System.Collections.Generic.List<PermissionResponse>>>> GetPermissions(CancellationToken cancellationToken)
        {
            var permissions = await _userService.GetPermissionsAsync(cancellationToken);
            return HandleOk(permissions);
        }
    }
}
