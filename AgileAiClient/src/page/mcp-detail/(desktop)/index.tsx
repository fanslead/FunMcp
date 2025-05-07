import { memo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import McpDetailInfo from "../features/McpDetailInfo";
import { McpServer, McpServerService } from "../../../services/service-proxies";


export default memo(() => {

    const { id } = useParams<{ id: string }>();
    if (id === undefined) return (<div>id is undefined</div>)

    const [mcp, setMcp] = useState({} as any);
    var mcpServerService = new McpServerService();

    useEffect(() => {
        loadingMcp();
    }, [id]);

    async function loadingMcp() {
        let data = await mcpServerService.mcpServerGET(id as string);
        setMcp(data);
    }


    return (
        <>
            <div style={{
                width: '100%',
                padding: 20
            }}>
                <McpDetailInfo value={mcp} />
            </div>
        </>
    )
});