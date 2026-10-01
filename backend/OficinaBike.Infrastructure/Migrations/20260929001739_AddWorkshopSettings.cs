using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OficinaBike.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkshopSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkshopSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CompanyName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    TradeName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    CorporateName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    CpfCnpj = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    StateRegistration = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    WhatsApp = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    Website = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    AddressId = table.Column<int>(type: "INTEGER", nullable: true),
                    LogoFileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    LogoContentType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    LogoStoragePath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    LogoData = table.Column<byte[]>(type: "BLOB", nullable: true),
                    FooterMessage = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    AdditionalInformation = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "INTEGER", nullable: true),
                    UpdatedByUserId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkshopSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkshopSettings_Addresses_AddressId",
                        column: x => x.AddressId,
                        principalTable: "Addresses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkshopSettings_AddressId",
                table: "WorkshopSettings",
                column: "AddressId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkshopSettings_IsActive",
                table: "WorkshopSettings",
                column: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkshopSettings");
        }
    }
}
