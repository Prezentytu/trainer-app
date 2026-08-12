using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class SessionOutOfOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "OutOfOrder",
                table: "WorkoutSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OutOfOrder",
                table: "WorkoutSessions");
        }
    }
}
