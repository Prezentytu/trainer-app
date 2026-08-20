using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class WdrozenieMoneyModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WdrozenieCreditGrosze",
                table: "Trainers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "WdrozeniePaidAt",
                table: "Trainers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WdrozeniePaymentIntentId",
                table: "Trainers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WdrozenieCreditGrosze",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "WdrozeniePaidAt",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "WdrozeniePaymentIntentId",
                table: "Trainers");
        }
    }
}
