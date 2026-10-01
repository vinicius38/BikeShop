# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["OficinaBike.sln", "./"]
COPY ["OficinaBike.API/OficinaBike.API.csproj", "OficinaBike.API/"]
COPY ["OficinaBike.Application/OficinaBike.Application.csproj", "OficinaBike.Application/"]
COPY ["OficinaBike.Domain/OficinaBike.Domain.csproj", "OficinaBike.Domain/"]
COPY ["OficinaBike.Infrastructure/OficinaBike.Infrastructure.csproj", "OficinaBike.Infrastructure/"]
COPY ["OficinaBike.UnitTests/OficinaBike.UnitTests.csproj", "OficinaBike.UnitTests/"]

# Restore packages
RUN dotnet restore "OficinaBike.API/OficinaBike.API.csproj"

# Copy the remaining source code
COPY . .

# Build and publish
WORKDIR "/src/OficinaBike.API"
RUN dotnet publish "OficinaBike.API.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port and start
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "OficinaBike.API.dll"]
