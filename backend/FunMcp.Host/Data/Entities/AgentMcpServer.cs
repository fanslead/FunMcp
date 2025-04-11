namespace FunMcp.Host.Data.Entities;

public class AgentMcpServer
{
    [StringLength(64)]
    public required string AgentId { get; set; }

    public virtual Agent? Agent { get; set; }

    [StringLength(64)]
    public required string McpServerId { get; set; }

    public virtual McpServer? McpServer { get; set; }   
}
