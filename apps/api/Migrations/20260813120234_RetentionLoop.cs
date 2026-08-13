using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class RetentionLoop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "LastDigestSentOn",
                table: "Trainers",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyClientReply",
                table: "Trainers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyPr",
                table: "Trainers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotifySessionComplete",
                table: "Trainers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotifyWeeklyDigest",
                table: "Trainers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "PlanKey",
                table: "Trainers",
                type: "text",
                nullable: false,
                defaultValue: "free");

            migrationBuilder.AddColumn<string>(
                name: "StripeCustomerId",
                table: "Trainers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeSubscriptionId",
                table: "Trainers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PortalPinHash",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PortalPinSalt",
                table: "Clients",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClientProgressPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    TakenOn = table.Column<DateOnly>(type: "date", nullable: false),
                    View = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    Bytes = table.Column<byte[]>(type: "bytea", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientProgressPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientProgressPhotos_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientProgressPhotos_ClientId_TakenOn",
                table: "ClientProgressPhotos",
                columns: new[] { "ClientId", "TakenOn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientProgressPhotos");

            migrationBuilder.DropColumn(
                name: "LastDigestSentOn",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "NotifyClientReply",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "NotifyPr",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "NotifySessionComplete",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "NotifyWeeklyDigest",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "PlanKey",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "StripeCustomerId",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "StripeSubscriptionId",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "PortalPinHash",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PortalPinSalt",
                table: "Clients");
        }
    }
}
