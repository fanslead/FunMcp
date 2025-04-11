namespace FunMcp.Host.Dto;

public class McpServerCreateDto
{
    [StringLength(64)]
    public required string Name { get; set; }

    // Stdio or Sse
    [StringLength(16)]
    public required string TransportType { get; set; }

    [StringLength(16)]
    public string? Command { get; set; }

    public List<string>? Arguments { get; set; } = [];

    public Dictionary<string, string>? EnvironmentVariables { get; set; } = [];

    [StringLength(256)]
    public string? Endpoint { get; set; }

    public Dictionary<string, string>? AdditionalHeaders { get; set; } = [];

    public int? MaxReconnectAttempts { get; set; }

    public int? ReconnectDelay { get; set; }

    public int? ConnectionTimeout { get; set; }

    public string? Description { get; set; }
}
