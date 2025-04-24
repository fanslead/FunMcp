namespace FunMcp.Host.Dto;

public class ImportMcpServerDeserializeDto
{
    public string? Name { get; set; }

    [JsonPropertyName("command")]
    public string? Command { get; set; }

    [JsonPropertyName("args")]
    public List<string>? Arguments { get; set; } = [];

    [JsonPropertyName("env")]
    public Dictionary<string, string>? EnvironmentVariables { get; set; } = [];

    [JsonPropertyName("url")]
    public string? Endpoint { get; set; }

    [JsonPropertyName("headers")]
    public Dictionary<string, string>? AdditionalHeaders { get; set; } = [];
}
