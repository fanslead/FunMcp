namespace FunMcp.Host.Dto;

public class ApplicationUpdateDto
{
    [StringLength(64)]
    public required string Name { get; set; }

    [StringLength(256)]
    public string? Description { get; set; }
}
