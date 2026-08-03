using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class MvpRetentionFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClientReply",
                table: "WorkoutSessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ClientReplyAt",
                table: "WorkoutSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ClientReplyReadAt",
                table: "WorkoutSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrainerComment",
                table: "WorkoutSessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TrainerCommentAt",
                table: "WorkoutSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SubstitutedFromExerciseId",
                table: "LoggedExercises",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClientCheckIns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    MoodScore = table.Column<int>(type: "integer", nullable: true),
                    SleepScore = table.Column<int>(type: "integer", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientCheckIns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientCheckIns_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClientPushSubscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    Endpoint = table.Column<string>(type: "text", nullable: false),
                    P256dh = table.Column<string>(type: "text", nullable: false),
                    Auth = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientPushSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientPushSubscriptions_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoggedExercises_SubstitutedFromExerciseId",
                table: "LoggedExercises",
                column: "SubstitutedFromExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientCheckIns_ClientId_Date",
                table: "ClientCheckIns",
                columns: new[] { "ClientId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientPushSubscriptions_ClientId",
                table: "ClientPushSubscriptions",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientPushSubscriptions_Endpoint",
                table: "ClientPushSubscriptions",
                column: "Endpoint",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LoggedExercises_Exercises_SubstitutedFromExerciseId",
                table: "LoggedExercises",
                column: "SubstitutedFromExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoggedExercises_Exercises_SubstitutedFromExerciseId",
                table: "LoggedExercises");

            migrationBuilder.DropTable(
                name: "ClientCheckIns");

            migrationBuilder.DropTable(
                name: "ClientPushSubscriptions");

            migrationBuilder.DropIndex(
                name: "IX_LoggedExercises_SubstitutedFromExerciseId",
                table: "LoggedExercises");

            migrationBuilder.DropColumn(
                name: "ClientReply",
                table: "WorkoutSessions");

            migrationBuilder.DropColumn(
                name: "ClientReplyAt",
                table: "WorkoutSessions");

            migrationBuilder.DropColumn(
                name: "ClientReplyReadAt",
                table: "WorkoutSessions");

            migrationBuilder.DropColumn(
                name: "TrainerComment",
                table: "WorkoutSessions");

            migrationBuilder.DropColumn(
                name: "TrainerCommentAt",
                table: "WorkoutSessions");

            migrationBuilder.DropColumn(
                name: "SubstitutedFromExerciseId",
                table: "LoggedExercises");
        }
    }
}
