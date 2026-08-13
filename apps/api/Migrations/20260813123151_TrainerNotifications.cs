using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class TrainerNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotifyPr",
                table: "Trainers");

            migrationBuilder.RenameColumn(
                name: "NotifySessionComplete",
                table: "Trainers",
                newName: "NotifyDailySummary");

            migrationBuilder.AddColumn<DateOnly>(
                name: "LastActivityEmailOn",
                table: "Trainers",
                type: "date",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TrainerNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TrainerId = table.Column<int>(type: "integer", nullable: false),
                    ClientId = table.Column<int>(type: "integer", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<int>(type: "integer", nullable: true),
                    CheckInId = table.Column<int>(type: "integer", nullable: true),
                    Preview = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainerNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainerNotifications_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrainerNotifications_ClientId",
                table: "TrainerNotifications",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainerNotifications_TrainerId_ReadAt_CreatedAt",
                table: "TrainerNotifications",
                columns: new[] { "TrainerId", "ReadAt", "CreatedAt" });

            migrationBuilder.Sql("""
                INSERT INTO "TrainerNotifications" ("TrainerId", "ClientId", "Kind", "SessionId", "CheckInId", "Preview", "CreatedAt", "ReadAt")
                SELECT c."TrainerId", s."ClientId", 'session_note', s."Id", NULL,
                  LEFT(TRIM(s."Note"), 120),
                  s."CreatedAt",
                  CASE WHEN s."TrainerComment" IS NOT NULL AND btrim(s."TrainerComment") <> '' THEN NOW() ELSE NULL END
                FROM "WorkoutSessions" s
                JOIN "Clients" c ON c."Id" = s."ClientId"
                WHERE s."Status" = 'completed'
                  AND s."Note" IS NOT NULL AND btrim(s."Note") <> ''
                  AND s."PerformedOn" >= (CURRENT_DATE - 14);

                INSERT INTO "TrainerNotifications" ("TrainerId", "ClientId", "Kind", "SessionId", "CheckInId", "Preview", "CreatedAt", "ReadAt")
                SELECT c."TrainerId", s."ClientId", 'session_reply', s."Id", NULL,
                  LEFT(TRIM(s."ClientReply"), 120),
                  COALESCE(s."ClientReplyAt", s."CreatedAt"),
                  s."ClientReplyReadAt"
                FROM "WorkoutSessions" s
                JOIN "Clients" c ON c."Id" = s."ClientId"
                WHERE s."ClientReply" IS NOT NULL AND btrim(s."ClientReply") <> ''
                  AND COALESCE(s."ClientReplyAt", s."CreatedAt") >= (NOW() - INTERVAL '14 days');

                INSERT INTO "TrainerNotifications" ("TrainerId", "ClientId", "Kind", "SessionId", "CheckInId", "Preview", "CreatedAt", "ReadAt")
                SELECT c."TrainerId", ci."ClientId", 'low_checkin', NULL, ci."Id",
                  'Samopoczucie ' || ci."MoodScore"::text || '/5',
                  ci."CreatedAt",
                  NULL
                FROM "ClientCheckIns" ci
                JOIN "Clients" c ON c."Id" = ci."ClientId"
                WHERE ci."MoodScore" IS NOT NULL AND ci."MoodScore" <= 2
                  AND ci."Date" >= (CURRENT_DATE - 14);

                INSERT INTO "TrainerNotifications" ("TrainerId", "ClientId", "Kind", "SessionId", "CheckInId", "Preview", "CreatedAt", "ReadAt")
                SELECT c."TrainerId", s."ClientId", 'out_of_order', s."Id", NULL,
                  'Zrobił trening poza kolejką',
                  s."CreatedAt",
                  NULL
                FROM "WorkoutSessions" s
                JOIN "Clients" c ON c."Id" = s."ClientId"
                WHERE s."OutOfOrder" AND s."Status" = 'completed'
                  AND s."PerformedOn" >= (CURRENT_DATE - 14);

                INSERT INTO "TrainerNotifications" ("TrainerId", "ClientId", "Kind", "SessionId", "CheckInId", "Preview", "CreatedAt", "ReadAt")
                SELECT c."TrainerId", h."ClientId", 'history_import', NULL, NULL,
                  'Klient wrzucił zdjęcia treningów — sprawdź, czy się zgadzają.',
                  h."CreatedAt",
                  NULL
                FROM "ClientHistoryImports" h
                JOIN "Clients" c ON c."Id" = h."ClientId"
                WHERE h."Status" = 'pending';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrainerNotifications");

            migrationBuilder.DropColumn(
                name: "LastActivityEmailOn",
                table: "Trainers");

            migrationBuilder.RenameColumn(
                name: "NotifyDailySummary",
                table: "Trainers",
                newName: "NotifySessionComplete");

            migrationBuilder.AddColumn<bool>(
                name: "NotifyPr",
                table: "Trainers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
