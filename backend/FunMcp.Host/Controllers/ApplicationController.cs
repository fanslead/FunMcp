namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ApplicationController(FunMcpDbContext dbContext, IMemoryCache memoryCache) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetApplications(string? filter)
    {
        var query = dbContext.Applications.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter))
        {
            query = query.Where(x => x.Name.Contains(filter) || x.Description.Contains(filter));
        }

        var applications = await query.ToListAsync();
        return Ok(applications);
    }

    [HttpGet]
    [Route("{id}")]
    public async Task<IActionResult> GetApplication(string id)
    {
        var application = await dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (application == null)
        {
            return NotFound();
        }
        return Ok(application);
    }

    [HttpPost]
    public async Task<IActionResult> CreateApplication([FromBody] ApplicationCreateDto dto)
    {
        var application = new Application
        {
            Name = dto.Name,
            Description = dto.Description,
            Id = Guid.NewGuid().ToString(),
            ApiKey = Guid.NewGuid().ToString()
        };

        await dbContext.Applications.AddAsync(application);
        await dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetApplication), new { id = application.Id }, application);
    }

    [HttpPut]
    [Route("{id}")]
    public async Task<IActionResult> UpdateApplication(string id, [FromBody] ApplicationUpdateDto application)
    {
        var existingApplication = await dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (existingApplication == null)
        {
            return NotFound();
        }
        existingApplication.Name = application.Name;
        existingApplication.Description = application.Description;
        dbContext.Applications.Update(existingApplication);
        await dbContext.SaveChangesAsync();
        memoryCache.Remove(existingApplication.ApiKey);
        return NoContent();
    }

    [HttpDelete]
    [Route("{id}")]
    public async Task<IActionResult> DeleteApplication(string id)
    {
        var application = await dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (application == null)
        {
            return NotFound();
        }
        dbContext.Applications.Remove(application);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut]
    [Route("RefreshApiKey/{id}")]
    public async Task<IActionResult> RefreshApiKey(string id)
    {
        var existingApplication = await dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (existingApplication == null)
        {
            return NotFound();
        }
        var oldKey = existingApplication.ApiKey;
        existingApplication.ApiKey = Guid.NewGuid().ToString();
        dbContext.Applications.Update(existingApplication);
        await dbContext.SaveChangesAsync();
        memoryCache.Remove(existingApplication.ApiKey);

        return NoContent();
    }
}
