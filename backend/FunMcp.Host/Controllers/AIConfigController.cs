namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AIConfigController(IOptionsMonitor<AIOptions> aiOptions) : ControllerBase
{
    [HttpGet]
    public ActionResult<List<AIConfigDto>> Get()
    {
        var options = aiOptions.CurrentValue;
       
        var result = options.Configs.Select(x => new AIConfigDto
        {
            Name = x.Key,
            Models = [.. x.Value.Models.Select(m => new AIModelDto
            {
                Name = m.Key,
                ModelId = m.Value
            })]
        }).ToList();

        return Ok(result);
    }
}
