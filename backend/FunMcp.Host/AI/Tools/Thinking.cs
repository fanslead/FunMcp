using System.ComponentModel;

namespace FunMcp.Host.AI.Tools;

public class Thinking
{
    static AIFunction? ThinkTool = null;

    [Description("这是用于系统化思考与规划的工具，支持用户在面对复杂问题或任务时，分阶段梳理思考、规划和行动步骤。工具强调思考（thought）、计划（plan）与实际行动（action）的结合，通过编号（thoughtNumber）追踪过程。该工具不会获取新信息或更改数据库，只会将想法附加到记忆中。当需要复杂推理或某种缓存记忆时，可以使用它。")]
    public static string Think([Required]string thought, [Required] string plan, [Required] string action, [Required] string thoughtNumber)
    {
        return "THINK DONE";
    }

    public static AIFunction GetTool()
    {
        if(ThinkTool == null)
        {
            ThinkTool = AIFunctionFactory.Create(Think, "Think", "这是用于系统化思考与规划的工具，支持用户在面对复杂问题或任务时，分阶段梳理思考、规划和行动步骤。工具强调思考（thought）、计划（plan）与实际行动（action）的结合，通过编号（thoughtNumber）追踪过程。该工具不会获取新信息或更改数据库，只会将想法附加到记忆中。当需要复杂推理或某种缓存记忆时，可以使用它。");  
        }

        return ThinkTool;
    }
}
