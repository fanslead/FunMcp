using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FunMcp.Host.Migrations
{
    /// <inheritdoc />
    public partial class Add_Mcp_Tag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tag",
                table: "McpServers",
                type: "TEXT",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tag",
                table: "McpServers");
        }
    }
}
