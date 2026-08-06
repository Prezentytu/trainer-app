using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSetNoteSideAndGoalWeight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "LoggedSets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Side",
                table: "LoggedSets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "GoalWeightKg",
                table: "Clients",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Note",
                table: "LoggedSets");

            migrationBuilder.DropColumn(
                name: "Side",
                table: "LoggedSets");

            migrationBuilder.DropColumn(
                name: "GoalWeightKg",
                table: "Clients");
        }
    }
}
