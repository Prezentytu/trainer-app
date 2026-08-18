using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrainerApp.Api.Migrations
{
    /// <inheritdoc />
    public partial class LoggedExerciseFormCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LoggedExerciseFormChecks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LoggedExerciseId = table.Column<int>(type: "integer", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    Bytes = table.Column<byte[]>(type: "bytea", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoggedExerciseFormChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoggedExerciseFormChecks_LoggedExercises_LoggedExerciseId",
                        column: x => x.LoggedExerciseId,
                        principalTable: "LoggedExercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoggedExerciseFormChecks_LoggedExerciseId",
                table: "LoggedExerciseFormChecks",
                column: "LoggedExerciseId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoggedExerciseFormChecks");
        }
    }
}
