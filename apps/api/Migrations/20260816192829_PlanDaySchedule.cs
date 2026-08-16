using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class PlanDaySchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DayOfWeek",
                table: "PlanDays",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AssignmentDayOverrides",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AssignmentId = table.Column<int>(type: "integer", nullable: false),
                    PlanDayId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssignmentDayOverrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssignmentDayOverrides_Assignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "Assignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssignmentDayOverrides_PlanDays_PlanDayId",
                        column: x => x.PlanDayId,
                        principalTable: "PlanDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentDayOverrides_AssignmentId_PlanDayId",
                table: "AssignmentDayOverrides",
                columns: new[] { "AssignmentId", "PlanDayId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssignmentDayOverrides_PlanDayId",
                table: "AssignmentDayOverrides",
                column: "PlanDayId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssignmentDayOverrides");

            migrationBuilder.DropColumn(
                name: "DayOfWeek",
                table: "PlanDays");
        }
    }
}
