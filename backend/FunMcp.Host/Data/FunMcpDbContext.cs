namespace FunMcp.Host.Data;

public class FunMcpDbContext : DbContext
{
    static JsonSerializerOptions JsonSerializerOptions = new()
    {

    };

    public FunMcpDbContext(DbContextOptions<FunMcpDbContext> options) : base(options)
    {
    }

    public DbSet<Application> Applications { get; set; }

    public DbSet<Agent> Agents { get; set; }

    public DbSet<McpServer> McpServers { get; set; }

    public DbSet<AgentMcpServer> AgentMcpServers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<McpServer>()
            .Property(e=>e.EnvironmentVariables)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, JsonSerializerOptions) ?? new Dictionary<string, string>()
            );

        modelBuilder.Entity<McpServer>()
            .Property(e=>e.AdditionalHeaders)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, JsonSerializerOptions) ?? new Dictionary<string, string>()
            );

        modelBuilder.Entity<McpServer>()
            .Property(e=>e.Arguments)
            .HasConversion(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions) ?? new List<string>()
            );

        modelBuilder.Entity<AgentMcpServer>()
            .HasKey(x => new { x.AgentId, x.McpServerId });

        modelBuilder.Entity<Application>()
            .HasIndex(x => x.ApiKey);
    }
}
