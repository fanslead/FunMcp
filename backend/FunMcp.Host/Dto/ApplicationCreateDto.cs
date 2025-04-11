namespace FunMcp.Host.Dto;

public class ApplicationCreateDto
{
    [StringLength(64)]
    public required string Name { get; set; }

    [StringLength(256)]
    public string? Description { get; set; }
}
