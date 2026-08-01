using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class ClientIntake : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClientIntakes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    GoalType = table.Column<string>(type: "text", nullable: true),
                    GoalDetails = table.Column<string>(type: "text", nullable: true),
                    Injuries = table.Column<string>(type: "text", nullable: true),
                    Pains = table.Column<string>(type: "text", nullable: true),
                    ChronicConditions = table.Column<string>(type: "text", nullable: true),
                    Medications = table.Column<string>(type: "text", nullable: true),
                    WorkType = table.Column<string>(type: "text", nullable: true),
                    StressLevel = table.Column<int>(type: "integer", nullable: true),
                    SleepHours = table.Column<string>(type: "text", nullable: true),
                    FreeTimeActivity = table.Column<string>(type: "text", nullable: true),
                    ExperienceLevel = table.Column<string>(type: "text", nullable: true),
                    PastActivities = table.Column<string>(type: "text", nullable: true),
                    TrainingHistoryNotes = table.Column<string>(type: "text", nullable: true),
                    SessionsPerWeek = table.Column<int>(type: "integer", nullable: true),
                    Availability = table.Column<string>(type: "text", nullable: true),
                    Equipment = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientIntakes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientIntakes_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientIntakes_ClientId",
                table: "ClientIntakes",
                column: "ClientId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientIntakes");
        }
    }
}
