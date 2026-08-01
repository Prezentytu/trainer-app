using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class ClientMeasurements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EnergyScore",
                table: "WorkoutSessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FeelingScore",
                table: "WorkoutSessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SleepScore",
                table: "WorkoutSessions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClientMeasurements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    MeasuredOn = table.Column<DateOnly>(type: "date", nullable: false),
                    WeightKg = table.Column<double>(type: "double precision", nullable: true),
                    WaistCm = table.Column<double>(type: "double precision", nullable: true),
                    ChestCm = table.Column<double>(type: "double precision", nullable: true),
                    HipsCm = table.Column<double>(type: "double precision", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientMeasurements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientMeasurements_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientMeasurements_ClientId_MeasuredOn",
                table: "ClientMeasurements",
                columns: new[] { "ClientId", "MeasuredOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientMeasurements");

            migrationBuilder.DropColumn(
                name: "EnergyScore",
                table: "WorkoutSessions");

            migrationBuilder.DropColumn(
                name: "FeelingScore",
                table: "WorkoutSessions");

            migrationBuilder.DropColumn(
                name: "SleepScore",
                table: "WorkoutSessions");
        }
    }
}
