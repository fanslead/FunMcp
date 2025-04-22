using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FunMcp.Host.Migrations
{
    /// <inheritdoc />
    public partial class Update_Entity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxReconnectAttempts",
                table: "McpServers");

            migrationBuilder.DropColumn(
                name: "ReconnectDelay",
                table: "McpServers");

            migrationBuilder.AddColumn<string>(
                name: "McpServerTools",
                table: "AgentMcpServers",
                type: "TEXT",
                maxLength: 2048,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "McpServerTools",
                table: "AgentMcpServers");

            migrationBuilder.AddColumn<int>(
                name: "MaxReconnectAttempts",
                table: "McpServers",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReconnectDelay",
                table: "McpServers",
                type: "INTEGER",
                nullable: true);
        }
    }
}
