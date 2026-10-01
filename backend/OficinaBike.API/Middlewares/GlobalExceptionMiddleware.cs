using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OficinaBike.Application.Common;
using OficinaBike.Domain.Exceptions;

namespace OficinaBike.API.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var traceId = context.TraceIdentifier;
            var statusCode = HttpStatusCode.InternalServerError;
            var message = "Ocorreu um erro interno ao processar a requisição.";
            List<ApiError>? errors = null;

            switch (exception)
            {
                case ValidationException valEx:
                    statusCode = HttpStatusCode.BadRequest;
                    message = "Dados inválidos fornecidos.";
                    errors = new List<ApiError>();
                    foreach (var err in valEx.Errors)
                    {
                        errors.Add(new ApiError(err.PropertyName, err.ErrorMessage));
                    }
                    _logger.LogWarning(exception, "Erro de validação [TraceId: {TraceId}]", traceId);
                    break;

                case NotFoundException notFoundEx:
                    statusCode = HttpStatusCode.NotFound;
                    message = notFoundEx.Message;
                    _logger.LogWarning("Recurso não encontrado [TraceId: {TraceId}]: {Message}", traceId, message);
                    break;

                case BusinessRuleException businessEx:
                    statusCode = HttpStatusCode.UnprocessableEntity;
                    message = businessEx.Message;
                    _logger.LogWarning("Violação de regra de negócio [TraceId: {TraceId}]: {Message}", traceId, message);
                    break;

                case ConcurrencyException concurrencyEx:
                    statusCode = HttpStatusCode.Conflict;
                    message = concurrencyEx.Message;
                    _logger.LogWarning("Conflito de concorrência [TraceId: {TraceId}]: {Message}", traceId, message);
                    break;

                case DbUpdateConcurrencyException dbConcEx:
                    statusCode = HttpStatusCode.Conflict;
                    message = "O registro foi alterado por outro usuário simultaneamente. Atualize os dados e tente novamente.";
                    _logger.LogWarning(dbConcEx, "DbUpdateConcurrencyException [TraceId: {TraceId}]", traceId);
                    break;

                case DomainException domainEx:
                    statusCode = HttpStatusCode.BadRequest;
                    message = domainEx.Message;
                    _logger.LogWarning("Erro de domínio [TraceId: {TraceId}]: {Message}", traceId, message);
                    break;

                default:
                    _logger.LogError(exception, "Exceção não tratada capturada pelo middleware [TraceId: {TraceId}]", traceId);
                    break;
            }

            var response = ApiResponse<object>.Fail(message, errors, traceId);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
        }
    }
}
