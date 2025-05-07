using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FunMcp.Host.Migrations
{
    /// <inheritdoc />
    public partial class support_streamable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "UseStreamableHttp",
                table: "McpServers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UseStreamableHttp",
                table: "McpServers");
        }
    }
}
